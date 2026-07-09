import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabaseClient';

/** Returns true if the product id belongs to a live API (no real stock) */
const isApiProduct = (productId) =>
  typeof productId === 'string' && (
    productId.startsWith('api-movie-') ||
    productId.startsWith('api-anime-') ||
    productId.startsWith('api-book-')
  );

const generateReceiptNumber = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 10; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return `REC-${result}`;
};

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();

  const [checkoutStep, setCheckoutStep] = useState('form'); // form | processing | success | error
  const [cartItems, setCartItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [invoice, setInvoice] = useState(null);

  const [shippingForm, setShippingForm] = useState({
    fullName:   currentUser?.name  || '',
    email:      currentUser?.email || '',
    address:    '',
    cardNumber: '',
    expiry:     '',
    cvv:        '',
  });

  // Cart is already hydrated by CartContext
  useEffect(() => {
    if (cart.length === 0) {
      setCheckoutStep('error');
      setErrorMessage('Your shelf is empty. Browse the catalog to add something.');
      return;
    }
    setCartItems(cart);
  }, [cart]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setCheckoutStep('processing');

    try {
      // ── 1. Deplete stock for seeded items via atomic RPC ─────────────────
      const seededItems = cartItems.filter(item => !isApiProduct(item.productId ?? item.id));

      for (const item of seededItems) {
        const productId = item.productId ?? item.id;
        const { data: success, error } = await supabase.rpc('decrement_stock', {
          p_product_id: productId,
          p_qty:        item.quantity,
        });

        if (error) {
          throw new Error(`Stock check failed for "${item.title}": ${error.message}`);
        }

        if (!success) {
          // Atomic check: someone else bought the last copy
          setCheckoutStep('form');
          setErrorMessage(
            `"${item.title}" no longer has enough stock. ` +
            `Please update your cart and try again.`
          );
          return;
        }
      }

      // ── 2. Build order line items ─────────────────────────────────────────
      const orderItems = cartItems.map(item => ({
        productId: item.productId ?? item.id,
        title:     item.title,
        category:  item.category,
        price:     item.price,
        quantity:  item.quantity,
        sellerId:  item.seller_id ?? null,
        source:    isApiProduct(item.productId ?? item.id) ? 'api' : 'db',
      }));

      // ── 3. Insert order into orders table ────────────────────────────────
      const receiptNumber = generateReceiptNumber();

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id:        currentUser.id,
          items:          orderItems,
          total:          totalAmount,
          receipt_number: receiptNumber,
        }])
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to record order: ${orderError.message}`);
      }

      // ── 4. Build invoice for display ──────────────────────────────────────
      setInvoice({
        id:            newOrder.id,
        receiptNumber: newOrder.receipt_number,
        date:          newOrder.created_at,
        userName:      currentUser.name,
        items:         orderItems,
        total:         totalAmount,
      });

      // ── 5. Clear cart ────────────────────────────────────────────────────
      await clearCart();

      setCheckoutStep('success');
      showToast('Transaction Successful! Order Invoice Generated.', 'success');

    } catch (err) {
      console.error('[Checkout] Error:', err);
      setCheckoutStep('form');
      setErrorMessage(err.message || 'Checkout failed. Please try again.');
    }
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Mini top bar */}
      <header style={{
        height: '60px', backgroundColor: 'var(--panel)', borderBottom: '1px solid var(--hairline)',
        display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'center'
      }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--signal)', textDecoration: 'none' }}>
          ORBIT CHECKOUT
        </Link>
      </header>

      <main style={{
        flex: 1, maxWidth: '750px', width: '100%',
        margin: 'clamp(1.5rem, 4vh, 3rem) auto',
        padding: '0 clamp(1rem, 4vw, 2rem)', boxSizing: 'border-box'
      }}>

        {/* FORM */}
        {checkoutStep === 'form' && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '2.5rem' }}>
            <h1 className="display-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>BILLING &amp; DISPATCH</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Confirm your checkout details below. This transaction is simulated to finalize your catalog order. No real payment processing is performed.
            </p>

            {errorMessage && (
              <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'rgba(230,57,70,0.15)', border: '1px solid #e63946', color: '#ff6b76', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1.5rem' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="checkout-form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" value={shippingForm.fullName} onChange={e => setShippingForm({ ...shippingForm, fullName: e.target.value })} className="form-input" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input type="email" value={shippingForm.email} onChange={e => setShippingForm({ ...shippingForm, email: e.target.value })} className="form-input" required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Shipping / Courier Address</label>
                <input type="text" value={shippingForm.address} onChange={e => setShippingForm({ ...shippingForm, address: e.target.value })} className="form-input" placeholder="e.g. 123 Collector Lane, Shelf City" required />
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simulated Card Details</span>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Card Number</label>
                  <input type="text" value={shippingForm.cardNumber} onChange={e => setShippingForm({ ...shippingForm, cardNumber: e.target.value })} className="form-input" placeholder="•••• •••• •••• ••••" required />
                </div>
                <div className="checkout-form-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expiry Date</label>
                    <input type="text" value={shippingForm.expiry} onChange={e => setShippingForm({ ...shippingForm, expiry: e.target.value })} className="form-input" placeholder="MM/YY" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">CVV / Code</label>
                    <input type="text" value={shippingForm.cvv} onChange={e => setShippingForm({ ...shippingForm, cvv: e.target.value })} className="form-input" placeholder="•••" maxLength="4" required />
                  </div>
                </div>
              </div>

              <div className="checkout-footer-row" style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Due</span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="checkout-buttons">
                  <Link to="/cart" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Back to Shelf</Link>
                  <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Buy Now</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* PROCESSING */}
        {checkoutStep === 'processing' && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--hairline)', borderTopColor: 'var(--signal)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '2rem' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 className="display-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Processing Payment...</h2>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              VERIFYING STOCK ALLOCATION &amp; RECORDING TRANSACTION...
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {checkoutStep === 'success' && invoice && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '2.5rem', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,106,61,0.15)', color: 'var(--signal)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>✓</span>
              <h1 className="display-title" style={{ fontSize: '2.25rem', color: 'var(--signal)', letterSpacing: '0.05em' }}>PAYMENT SUCCESSFUL</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your media items have been logged onto your dashboard shelf storage.</p>
            </div>

            <div style={{ background: '#0B0C10', border: '1px solid var(--hairline)', borderRadius: '4px', padding: '1.5rem 2rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '2.5rem' }}>
{`==================================================
              ORBIT CATALOG RECEIPT
==================================================
DATE:    ${new Date(invoice.date).toLocaleString()}
ORDER:   ${invoice.id}
RECEIPT: ${invoice.receiptNumber}
BUYER:   ${invoice.userName.toUpperCase()}
==================================================
ITEMS DETAILED:
${invoice.items.map(item => {
  const line = `${item.title.substring(0, 24)} x${item.quantity}`;
  const priceStr = `$${(item.price * item.quantity).toFixed(2)}`;
  const spaces = ' '.repeat(Math.max(2, 48 - line.length - priceStr.length));
  return `${line}${spaces}${priceStr}`;
}).join('\n')}
==================================================
SUBTOTAL:                               $${invoice.total.toFixed(2)}
POSTAGE:                                   $0.00
--------------------------------------------------
TOTAL CHARGED:                          $${invoice.total.toFixed(2)}
==================================================
  * SIMULATED TRANSACTIONS. NO REAL FUNDS TRANSFERRED.
==================================================`}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/dashboard/buyer?tab=orders" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>View Order History</Link>
              <Link to="/" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Return to Shelf</Link>
            </div>
          </div>
        )}

        {/* ERROR / EMPTY CART */}
        {checkoutStep === 'error' && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', marginBottom: '2rem' }}>{errorMessage}</p>
            <Link to="/browse" className="btn btn-primary">Browse the catalog</Link>
          </div>
        )}
      </main>

      <footer style={{ padding: '2rem', borderTop: '1px solid var(--hairline)', backgroundColor: 'var(--panel)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
        <span>&copy; 2026 Orbit Checkout System. Simulated operations.</span>
      </footer>
    </div>
  );
};

export default CheckoutPage;
