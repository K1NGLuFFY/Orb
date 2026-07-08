import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { readStorage, writeStorage, KEYS } from '../../utils/localStorage';
import { useToast } from '../../context/ToastContext';

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();

  // Lifecycle states
  const [checkoutStep, setCheckoutStep] = useState('form'); // form | processing | success | error
  const [cartItems, setCartItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Simulated invoice output
  const [invoice, setInvoice] = useState(null);

  // Form inputs
  const [shippingForm, setShippingForm] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    address: '123 Collector Lane, Shelf City',
    cardNumber: '4111 2222 3333 4444',
    expiry: '12/28',
    cvv: '123'
  });

  // Load and validate cart items on load
  useEffect(() => {
    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const hydrated = cart.map(item => {
      const prod = dbProducts.find(p => p.id === item.productId);
      if (!prod) return null;
      return {
        ...prod,
        quantity: item.quantity
      };
    }).filter(Boolean);

    setCartItems(hydrated);

    if (hydrated.length === 0) {
      setCheckoutStep('error');
      setErrorMessage("Your shelf is empty. Browse the catalog to add something.");
    }
  }, [cart]);

  // Calculations
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Random alphanumeric string generator
  const generateId = (prefix, length = 8) => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // double check stock limits
    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    let stockValid = true;
    let outOfStockItemName = '';

    for (const item of cartItems) {
      const dbProd = dbProducts.find(p => p.id === item.id);
      if (!dbProd || dbProd.stock < item.quantity) {
        stockValid = false;
        outOfStockItemName = dbProd ? dbProd.title : 'An item';
        break;
      }
    }

    if (!stockValid) {
      setCheckoutStep('form');
      setErrorMessage(`"${outOfStockItemName}" is out of stock or does not have enough quantities available.`);
      return;
    }

    // Step 2: Processing Payment (2 seconds)
    setCheckoutStep('processing');

    setTimeout(() => {
      // Step 3: Deplete Stocks & Register Invoice Order
      try {
        const freshProducts = readStorage(KEYS.PRODUCTS) || [];
        
        // 1. Deplete stock
        cartItems.forEach(item => {
          const index = freshProducts.findIndex(p => p.id === item.id);
          if (index !== -1) {
            freshProducts[index].stock = Math.max(0, freshProducts[index].stock - item.quantity);
          }
        });
        writeStorage(KEYS.PRODUCTS, freshProducts);

        // 2. Generate details
        const orderId = generateId('ORD', 8);
        const receiptNumber = generateId('REC', 10);
        const dateStr = new Date().toISOString();

        const orderInvoice = {
          id: orderId,
          userId: currentUser.id,
          userName: currentUser.name,
          date: dateStr,
          receiptNumber: receiptNumber,
          items: cartItems.map(item => ({
            productId: item.id,
            title: item.title,
            category: item.category,
            price: item.price,
            quantity: item.quantity
          })),
          total: totalAmount
        };

        // 3. Write to order history
        const dbOrders = readStorage(KEYS.ORDERS) || [];
        dbOrders.push(orderInvoice);
        writeStorage(KEYS.ORDERS, dbOrders);

        // 4. Save locally to show invoice view
        setInvoice(orderInvoice);

        // 5. Clear cart in store
        clearCart();

        // 6. Transition
        setCheckoutStep('success');
        showToast('Simulated Transaction Successful! Order Invoice Generated.', 'success');
      } catch (err) {
        console.error(err);
        setCheckoutStep('form');
        setErrorMessage('Simulation checkout failed. Try again.');
      }
    }, 2000);
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mini top bar */}
      <header style={{
        height: '60px',
        backgroundColor: 'var(--panel)',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        justifyContent: 'center'
      }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--signal)', textDecoration: 'none' }}>
          ORBIT CHECKOUT
        </Link>
      </header>

      <main style={{
        flex: 1,
        maxWidth: '750px',
        width: '100%',
        margin: '3rem auto',
        padding: '0 2rem'
      }}>

        {/* STEP 1: FILL FORM */}
        {checkoutStep === 'form' && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '2.5rem'
          }}>
            <h1 className="display-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              BILLING & DISPATCH
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Confirm your checkout details below. This transaction is entirely simulated.
            </p>

            {errorMessage && (
              <div style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: 'rgba(230, 57, 70, 0.15)',
                border: '1px solid #e63946',
                color: '#ff6b76',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontWeight: '500',
                marginBottom: '1.5rem'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Shipping / Courier Address</label>
                <input 
                  type="text" 
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {/* Payment Section */}
              <div style={{
                borderTop: '1px solid var(--hairline)',
                paddingTop: '1.5rem',
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Simulated Card Payment
                </span>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Card Number</label>
                  <input 
                    type="text" 
                    value={shippingForm.cardNumber}
                    onChange={(e) => setShippingForm({ ...shippingForm, cardNumber: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expiry Date</label>
                    <input 
                      type="text" 
                      value={shippingForm.expiry}
                      onChange={(e) => setShippingForm({ ...shippingForm, expiry: e.target.value })}
                      className="form-input"
                      placeholder="MM/YY"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">CVV / Code</label>
                    <input 
                      type="text" 
                      value={shippingForm.cvv}
                      onChange={(e) => setShippingForm({ ...shippingForm, cvv: e.target.value })}
                      className="form-input"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Total Due & Submit */}
              <div style={{
                borderTop: '1px solid var(--hairline)',
                paddingTop: '1.5rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Due</span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link to="/cart" className="btn btn-secondary">
                    Back to Shelf
                  </Link>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                    Buy Now
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: PROCESSING LOADER */}
        {checkoutStep === 'processing' && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Simple spinner */}
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--hairline)',
              borderTopColor: 'var(--signal)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '2rem'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            
            <h2 className="display-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Processing Payment...
            </h2>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              VERIFYING STOCK ALLOCATION & SIMULATING TRANSACTION LEDGER...
            </p>
          </div>
        )}

        {/* STEP 3: SUCCESS INVOICE RECEIPT */}
        {checkoutStep === 'success' && invoice && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '2.5rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
          }}>
            
            {/* Header Success info */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 106, 61, 0.15)',
                color: 'var(--signal)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                ✓
              </span>
              <h1 className="display-title" style={{ fontSize: '2.25rem', color: 'var(--signal)', letterSpacing: '0.05em' }}>
                PAYMENT SUCCESSFUL
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Your media items have been logged onto your dashboard shelf storage.
              </p>
            </div>

            {/* Fanned receipt layout (JetBrains Mono formatting) */}
            <div style={{
              background: '#0B0C10',
              border: '1px solid var(--hairline)',
              borderRadius: '4px',
              padding: '1.5rem 2rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--text)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              marginBottom: '2.5rem'
            }}>
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
  * SIMULATED CHECKSUM. NO REAL FUND CHARGES.
==================================================`}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/dashboard/buyer?tab=orders" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                View Order History
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>
                Return to Shelf
              </Link>
            </div>

          </div>
        )}

        {/* STEP 4: ERROR / EMPTY CART STATE */}
        {checkoutStep === 'error' && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '4rem 2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', marginBottom: '2rem' }}>
              {errorMessage}
            </p>
            <Link to="/browse" className="btn btn-primary">
              Browse the catalog
            </Link>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--hairline)',
        backgroundColor: 'var(--panel)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        <span>&copy; 2026 Orbit Checkout System. Simulated operations.</span>
      </footer>

    </div>
  );
};

export default CheckoutPage;
