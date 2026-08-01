import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { waitUntil } from '@vercel/functions';

const isApiProduct = (productId) =>
  typeof productId === 'string' && (
    productId.startsWith('api-movie-') ||
    productId.startsWith('api-anime-') ||
    productId.startsWith('api-book-') ||
    productId.startsWith('api-manga-')
  );

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { reference, cartItems } = req.body;
  if (!reference || !cartItems || !Array.isArray(cartItems)) {
    return res.status(400).json({ error: 'Missing reference or cart items' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // 1. Get user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Failed to get user');

    // 2. Validate prices and calculate expected total
    let expectedTotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const productId = item.productId || item.id;
      let realPrice = 0;

      if (isApiProduct(productId)) {
        // Look up securely cached price
        const { data: cached, error } = await supabase
          .from('api_products_cache')
          .select('price')
          .eq('id', productId)
          .single();

        if (error || !cached) {
          return res.status(400).json({ error: `API product "${item.title}" missing from secure cache. Please try adding it to your cart again.` });
        }
        realPrice = parseFloat(cached.price);
      } else {
        // Look up DB price
        const { data: dbItem, error } = await supabase
          .from('products')
          .select('price')
          .eq('id', productId)
          .single();

        if (error || !dbItem) {
          return res.status(400).json({ error: `Database product "${item.title}" not found.` });
        }
        realPrice = parseFloat(dbItem.price);
      }

      // Explicitly reject tampered client prices
      if (Math.abs(realPrice - parseFloat(item.price)) > 0.01) {
        return res.status(400).json({ 
          error: `Price mismatch for "${item.title}". Client reported USD ${item.price}, but secure server check expects USD ${realPrice}. Checkout rejected.` 
        });
      }

      expectedTotal += realPrice * item.quantity;

      orderItems.push({
        productId,
        title: item.title,
        category: item.category,
        price: realPrice,
        quantity: item.quantity,
        sellerId: item.seller_id ?? null,
        source: isApiProduct(productId) ? 'api' : 'db',
      });
    }

    // 3. Verify with Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      console.error('Missing PAYSTACK_SECRET_KEY');
      return res.status(500).json({ error: 'Server misconfiguration: Payment gateway unavailable' });
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`
      }
    });
    
    const paystackData = await paystackRes.json();
    if (!paystackData.status || paystackData.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed with provider' });
    }

    // Compare amounts (Paystack amount is in kobo, so * 100)
    const amountPaidKobo = paystackData.data.amount;
    const USD_TO_NGN_RATE = 100;
    const expectedKobo = Math.round(expectedTotal * USD_TO_NGN_RATE * 100);

    if (amountPaidKobo < expectedKobo) {
      return res.status(400).json({ error: `Insufficient payment. Paid ₦${amountPaidKobo/100}, Expected ₦${expectedKobo/100}` });
    }

    // 4. Atomic operations
    // Decrement stock for DB items
    const dbItems = orderItems.filter(i => i.source === 'db');
    for (const item of dbItems) {
      const { data: success, error } = await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_qty: item.quantity,
      });

      if (error || !success) {
        // Note: In a robust production system, if payment succeeded but stock failed,
        // we'd need to issue a refund or flag for manual review. For this demo, we'll
        // throw an error.
        return res.status(400).json({ error: `Stock depletion failed for "${item.title}"` });
      }
    }

    // Insert order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        items: orderItems,
        total: expectedTotal,
        receipt_number: reference, // Use Paystack reference as the receipt number
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Clear cart (DB items)
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    // Feature 3: Asynchronous Order Confirmation Email
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const emailPromise = resend.emails.send({
        from: 'Orbit Store <orders@orbit-store.com>', // Assuming domain is verified
        to: user.email,
        subject: `Order Confirmation - #${reference}`,
        html: `
          <div style="font-family: monospace; padding: 20px;">
            <h2>Thank you for your order, ${user.user_metadata?.name || 'Customer'}!</h2>
            <p>Your order (Receipt: ${reference}) has been successfully verified.</p>
            <h3>Order Summary:</h3>
            <ul>
              ${orderItems.map(item => `<li>${item.quantity}x ${item.title} - ₦${(item.price * 300).toLocaleString()}</li>`).join('')}
            </ul>
            <p><strong>Total Paid:</strong> ₦${(expectedTotal * 300).toLocaleString()}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
        `
      }).catch(err => console.error('Failed to send confirmation email:', err));

      // waitUntil ensures Vercel doesn't kill the function before the email fires
      waitUntil(emailPromise);
    }

    // Return created order immediately (does not wait for email)
    return res.status(200).json({ success: true, order: newOrder });

  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
