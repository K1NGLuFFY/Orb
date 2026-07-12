import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageHelper } from '../../utils/storageHelper';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const creatorLabels = {
  Anime: 'Studio',
  Manga: 'Author',
  Book: 'Author',
  Comic: 'Author/Artist',
  Movie: 'Director'
};

const SellerDashboard = () => {
  const { currentUser, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // State
  const [myProducts, setMyProducts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  
  // Profile Editor Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [profileFeedback, setProfileFeedback] = useState({ text: '', type: '' });

  // Product Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if adding new
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'Book',
    creator: '',
    description: '',
    imageUrl: '',
    genre: '',
    releaseYear: '',
    language: 'English',
    price: '',
    stock: ''
  });
  const [productFeedback, setProductFeedback] = useState({ text: '', type: '' });

  // Load seller data
  useEffect(() => {
    let active = true;
    async function loadSellerData() {
      try {
        const [dbProducts, dbOrders] = await Promise.all([
          storageHelper.getProducts({ sellerId: currentUser.id }),
          storageHelper.getOrders()
        ]);
        if (!active) return;
        setMyProducts(dbProducts);

        const sales = [];
        dbOrders.forEach(order => {
          // In Supabase, items inside orders table items JSONB array are saved with sellerId
          const sellerItems = order.items.filter(item => item.sellerId === currentUser.id);
          if (sellerItems.length > 0) {
            sellerItems.forEach(item => {
              sales.push({
                orderId: order.id,
                buyerName: order.profiles?.name || 'Buyer',
                date: order.created_at,
                productId: item.productId,
                title: item.title,
                category: item.category,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
              });
            });
          }
        });
        setSalesOrders(sales);
      } catch (err) {
        console.error('Failed to load seller dashboard data:', err);
      }
    }
    if (currentUser) {
      loadSellerData();
    }
    return () => { active = false; };
  }, [currentUser]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileFeedback({ text: '', type: '' });

    if (!profileForm.name || !profileForm.email) {
      setProfileFeedback({ text: 'Name and email are required.', type: 'error' });
      return;
    }

    if (profileForm.password) {
      if (profileForm.password.length < 6) {
        setProfileFeedback({ text: 'New password must be at least 6 characters.', type: 'error' });
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setProfileFeedback({ text: 'Passwords do not match.', type: 'error' });
        return;
      }
    }

    const success = await updateProfile({
      name: profileForm.name,
      email: profileForm.email,
      ...(profileForm.password && { password: profileForm.password })
    });

    if (success) {
      setProfileFeedback({ text: 'Profile updated successfully!', type: 'success' });
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } else {
      setProfileFeedback({ text: 'Failed to update profile. Email might be in use.', type: 'error' });
    }
  };

  // Open Modal for Add
  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      category: 'Book',
      creator: '',
      description: '',
      imageUrl: '',
      genre: '',
      releaseYear: new Date().getFullYear().toString(),
      language: 'English',
      price: '',
      stock: ''
    });
    setProductFeedback({ text: '', type: '' });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      category: product.category,
      creator: product.creator,
      description: product.description,
      imageUrl: product.imageUrl,
      genre: product.genre,
      releaseYear: product.releaseYear,
      language: product.language,
      price: product.price.toString(),
      stock: product.stock.toString()
    });
    setProductFeedback({ text: '', type: '' });
    setIsModalOpen(true);
  };

  // Handle Add/Edit Form Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductFeedback({ text: '', type: '' });

    // Validations
    if (!productForm.title || !productForm.creator || !productForm.description || !productForm.imageUrl || !productForm.genre || !productForm.price || !productForm.stock) {
      setProductFeedback({ text: 'All fields are required.', type: 'error' });
      return;
    }

    // Image URL validation (must be external URL)
    if (!productForm.imageUrl.startsWith('http://') && !productForm.imageUrl.startsWith('https://')) {
      setProductFeedback({ text: 'Image URL must be an external link starting with http:// or https://', type: 'error' });
      return;
    }

    const parsedPrice = parseFloat(productForm.price);
    const parsedStock = parseInt(productForm.stock);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setProductFeedback({ text: 'Please enter a valid price greater than 0.', type: 'error' });
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      setProductFeedback({ text: 'Please enter a valid stock count (0 or more).', type: 'error' });
      return;
    }

    if (editingProduct) {
      // Modify existing
      const updated = {
        title: productForm.title,
        category: productForm.category,
        genre: productForm.genre,
        price: parsedPrice,
        stock: parsedStock,
        image_url: productForm.imageUrl
      };

      try {
        await storageHelper.updateProduct(editingProduct.id, updated);
        const dbProducts = await storageHelper.getProducts({ sellerId: currentUser.id });
        setMyProducts(dbProducts);
        setIsModalOpen(false);
      } catch (err) {
        setProductFeedback({ text: err.message, type: 'error' });
      }
    } else {
      // Add new product
      const newProduct = {
        title: productForm.title,
        category: productForm.category,
        genre: productForm.genre,
        price: parsedPrice,
        stock: parsedStock,
        image_url: productForm.imageUrl,
        seller_id: currentUser.id
      };

      try {
        await storageHelper.insertProduct(newProduct);
        const dbProducts = await storageHelper.getProducts({ sellerId: currentUser.id });
        setMyProducts(dbProducts);
        setIsModalOpen(false);
      } catch (err) {
        setProductFeedback({ text: err.message, type: 'error' });
      }
    }
  };

  // Delete own listing
  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmDelete) return;

    try {
      await storageHelper.deleteProduct(productId);
      const dbProducts = await storageHelper.getProducts({ sellerId: currentUser.id });
      setMyProducts(dbProducts);
    } catch (err) {
      alert(err.message);
    }
  };

  // Stats calculation
  const totalListed = myProducts.length;
  const totalStockCount = myProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalUnitsSold = salesOrders.reduce((sum, s) => sum + s.quantity, 0);
  const totalEarnings = salesOrders.reduce((sum, s) => sum + s.subtotal, 0);

  return (
    <div>
      {/* Title Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="display-title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            {activeTab === 'overview' && 'STORE OVERVIEW'}
            {activeTab === 'listings' && 'MANAGE LISTINGS'}
            {activeTab === 'sales' && 'SALES INVOICES'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'overview' && 'Inspect your store analytics and manage identification keys.'}
            {activeTab === 'listings' && 'Publish, update, and manage media listings for target markets.'}
            {activeTab === 'sales' && 'Review transactions of products sold through the shelf catalogue.'}
          </p>
        </div>

        {activeTab === 'listings' && (
          <button onClick={openAddModal} className="btn btn-primary">
            + Add New Listing
          </button>
        )}
      </div>

      {/* RENDER VIEWS */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Stats Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Grid of stats */}
            <div className="stats-grid-2col">
              <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.25rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Items Listed
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                  {totalListed}
                </span>
              </div>

              <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.25rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Active Shelf Stock
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                  {totalStockCount}
                </span>
              </div>

              <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.25rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Units Sold
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                  {totalUnitsSold}
                </span>
              </div>

              <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.25rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Total Income
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                  ${totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Seller profile info */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: '6px',
              padding: '2rem'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                Merchant Details
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Store Name: </span>
                  <span style={{ fontWeight: '600' }}>{currentUser.name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Merchant Email: </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{currentUser.email}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                  <span style={{
                    color: 'var(--signal)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(255, 106, 61, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    {currentUser.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Edit Form */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '2rem'
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Store Settings
            </h3>

            {profileFeedback.text && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: profileFeedback.type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255, 106, 61, 0.15)',
                border: `1px solid ${profileFeedback.type === 'error' ? '#e63946' : 'var(--signal)'}`,
                color: profileFeedback.type === 'error' ? '#ff6b76' : 'var(--text)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {profileFeedback.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Store / Display Name</label>
                <input 
                  type="text" 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Merchant Email</label>
                <input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                <label className="form-label">New Password (Leave blank to keep current)</label>
                <input 
                  type="password" 
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="form-input"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input 
                  type="password" 
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Merchant Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="table-scroll-wrapper" style={{ background: 'var(--panel)' }}>
          {myProducts.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--panel-raised)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Cover / Item Details</th>
                  <th style={{ padding: '1rem 1.5rem', width: '150px' }}>Category</th>
                  <th style={{ padding: '1rem 1.5rem', width: '120px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '1rem 1.5rem', width: '120px', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '1rem 1.5rem', width: '180px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map(product => {
                  const spineColor = categoryColors[product.category] || 'var(--text-muted)';
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                      <td style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '50px', height: '70px', background: '#101115', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                          {/* Mini Spine Tab */}
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: spineColor }} />
                          <img src={product.imageUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', paddingLeft: '3px' }} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold', display: 'block', color: 'var(--text)' }}>{product.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {creatorLabels[product.category] || 'Creator'}: {product.creator}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: spineColor, fontWeight: 'bold' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: spineColor }} />
                          {product.category === 'Book' ? 'Book' : product.category === 'Comic' ? 'Comic' : product.category === 'Movie' ? 'Movie' : product.category}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--signal)' }}>
                        ${product.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: product.stock === 0 ? '#FF4D6D' : 'var(--text)' }}>
                          {product.stock} units
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => openEditModal(product)} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#351717', border: '1px solid #FF4D6D', color: '#FF4D6D' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                You don't have any listings yet.
              </p>
              <button onClick={openAddModal} className="btn btn-primary">
                + Create First Listing
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. SALES INVOICES TAB */}
      {activeTab === 'sales' && (
        <div className="table-scroll-wrapper" style={{ background: 'var(--panel)' }}>
          {salesOrders.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--panel-raised)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Order Info</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Product Sold</th>
                  <th style={{ padding: '1rem 1.5rem', width: '180px' }}>Buyer Name</th>
                  <th style={{ padding: '1rem 1.5rem', width: '100px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '1rem 1.5rem', width: '120px', textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...salesOrders].reverse().map((sale, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--signal)', fontFamily: 'var(--font-mono)' }}>
                        {sale.orderId}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(sale.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{sale.title}</span>
                      <span style={{ fontSize: '0.75rem', color: categoryColors[sale.category] || 'var(--text-muted)' }}>
                        {sale.category}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>{sale.buyerName}</td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {sale.quantity}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                      ${sale.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
              No units sold from your catalog listings yet.
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL DIALOG FOR ADD / EDIT PRODUCTS */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 12, 16, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200,
          padding: '2rem'
        }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
          }}>
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="display-title" style={{ fontSize: '1.5rem' }}>
                {editingProduct ? 'EDIT SHELF PRODUCT' : 'ADD NEW CATALOG SHELF'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Feedback message */}
            {productFeedback.text && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: productFeedback.type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255, 106, 61, 0.15)',
                border: `1px solid ${productFeedback.type === 'error' ? '#e63946' : 'var(--signal)'}`,
                color: productFeedback.type === 'error' ? '#ff6b76' : 'var(--text)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {productFeedback.text}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-grid-2col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Book">Book</option>
                    <option value="Anime">Anime</option>
                    <option value="Manga">Manga</option>
                    <option value="Comic">Comic</option>
                    <option value="Movie">Movie</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{creatorLabels[productForm.category] || 'Creator'}</label>
                  <input 
                    type="text"
                    value={productForm.creator}
                    onChange={(e) => setProductForm({ ...productForm, creator: e.target.value })}
                    className="form-input"
                    placeholder={`e.g. ${productForm.category === 'Anime' ? 'Gainax' : productForm.category === 'Movie' ? 'Christopher Nolan' : 'Author Name'}`}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Title / Caption</label>
                <input 
                  type="text" 
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description / Summary</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">External Image URL (e.g. Unsplash cover link)</label>
                <input 
                  type="url" 
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  * No file uploads allowed. To protect storage limits, use a direct image URL.
                </span>
              </div>

              <div className="form-grid-2col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Genre (Comma-separated)</label>
                  <input 
                    type="text" 
                    value={productForm.genre}
                    onChange={(e) => setProductForm({ ...productForm, genre: e.target.value })}
                    className="form-input"
                    placeholder="Sci-Fi, Action, Drama"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Release Year</label>
                  <input 
                    type="text" 
                    value={productForm.releaseYear}
                    onChange={(e) => setProductForm({ ...productForm, releaseYear: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 1999"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Language</label>
                  <input 
                    type="text" 
                    value={productForm.language}
                    onChange={(e) => setProductForm({ ...productForm, language: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="form-input"
                    placeholder="29.99"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Stock Qty</label>
                  <input 
                    type="number" 
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="form-input"
                    placeholder="10"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  {editingProduct ? 'Save Changes' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
