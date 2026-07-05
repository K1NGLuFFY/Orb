import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readStorage, writeStorage, KEYS } from '../../utils/localStorage';
import { storageHelper } from '../../utils/storageHelper';
import { hashPassword } from '../../utils/crypto';

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

const AdminDashboard = () => {
  const { currentUser, resetDemoData } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // DB States
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Selection tables
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  // Batch actions selection
  const [productBatchAction, setProductBatchAction] = useState('');
  const [userBatchAction, setUserBatchAction] = useState('');

  // Right-hand sidebar filter states
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStock, setFilterStock] = useState('All'); // All | Out | Low | High
  const [filterPrice, setFilterPrice] = useState('All'); // All | Under15 | Over15

  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Form states
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [tickerText, setTickerText] = useState('');
  const [registrationsOpen, setRegistrationsOpen] = useState(true);

  // Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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

  // Reload DB Helper
  const reloadData = () => {
    setUsers(storageHelper.getUsers(currentUser));
    setProducts(storageHelper.getProducts(currentUser));
    setOrders(readStorage(KEYS.ORDERS) || []);
    setAnnouncements(readStorage(KEYS.ANNOUNCEMENTS) || []);

    const sysSettings = readStorage(KEYS.SETTINGS) || {};
    setTickerText(sysSettings.announcementTicker || '');
    setRegistrationsOpen(sysSettings.allowNewRegistrations !== false);

    // Reset select sets
    setSelectedProductIds(new Set());
    setSelectedUserIds(new Set());
  };

  useEffect(() => {
    reloadData();
  }, [activeTab, filterCategory, filterStock, filterPrice, filterRole, filterStatus]);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  // Checkbox functions for Products
  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const ids = getFilteredProducts().map(p => p.id);
      setSelectedProductIds(new Set(ids));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleSelectProduct = (id) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  // Checkbox functions for Users
  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      // Omit self and Admins from selection for safety in batch actions
      const ids = getFilteredUsers()
        .filter(u => u.id !== currentUser.id && u.role !== 'Admin')
        .map(u => u.id);
      setSelectedUserIds(new Set(ids));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (id) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };

  // Filters calculation
  const getFilteredProducts = () => {
    let list = [...products];

    // Category filter
    if (filterCategory !== 'All') {
      list = list.filter(p => p.category === filterCategory);
    }

    // Stock filter
    if (filterStock === 'Out') {
      list = list.filter(p => p.stock === 0);
    } else if (filterStock === 'Low') {
      list = list.filter(p => p.stock > 0 && p.stock < 5);
    } else if (filterStock === 'High') {
      list = list.filter(p => p.stock >= 5);
    }

    // Price filter
    if (filterPrice === 'Under15') {
      list = list.filter(p => p.price < 15);
    } else if (filterPrice === 'Over15') {
      list = list.filter(p => p.price >= 15);
    }

    return list;
  };

  const getFilteredUsers = () => {
    let list = [...users];

    // Role filter
    if (filterRole !== 'All') {
      list = list.filter(u => u.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'All') {
      list = list.filter(u => u.status === filterStatus);
    }

    return list;
  };

  // Batch action executions
  const handleExecuteProductBatch = () => {
    if (selectedProductIds.size === 0) {
      showFeedback('No items selected.', 'error');
      return;
    }

    if (!productBatchAction) {
      showFeedback('Please choose a valid administrative action.', 'error');
      return;
    }

    const allProducts = readStorage(KEYS.PRODUCTS) || [];
    let updatedProducts = [...allProducts];

    if (productBatchAction === 'delete') {
      const confirmDelete = window.confirm(`Delete the ${selectedProductIds.size} selected item listings?`);
      if (!confirmDelete) return;
      updatedProducts = allProducts.filter(p => !selectedProductIds.has(p.id));
    } else if (productBatchAction === 'restock_10') {
      updatedProducts = allProducts.map(p => {
        if (selectedProductIds.has(p.id)) {
          return { ...p, stock: 10 };
        }
        return p;
      });
    } else if (productBatchAction === 'deplete_stock') {
      updatedProducts = allProducts.map(p => {
        if (selectedProductIds.has(p.id)) {
          return { ...p, stock: 0 };
        }
        return p;
      });
    } else if (productBatchAction === 'markdown_50') {
      updatedProducts = allProducts.map(p => {
        if (selectedProductIds.has(p.id)) {
          return { ...p, price: parseFloat((p.price * 0.5).toFixed(2)) };
        }
        return p;
      });
    }

    try {
      storageHelper.saveProducts(updatedProducts, currentUser);
      showFeedback(`Successfully updated ${selectedProductIds.size} listings.`);
      reloadData();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const handleExecuteUserBatch = () => {
    if (selectedUserIds.size === 0) {
      showFeedback('No users selected.', 'error');
      return;
    }

    if (!userBatchAction) {
      showFeedback('Please select a user action.', 'error');
      return;
    }

    const allUsers = readStorage(KEYS.KEYS_USERS || KEYS.USERS) || [];
    let updatedUsers = [...allUsers];

    if (userBatchAction === 'delete') {
      const confirmDelete = window.confirm(`Permanently remove ${selectedUserIds.size} user profiles?`);
      if (!confirmDelete) return;
      updatedUsers = allUsers.filter(u => !selectedUserIds.has(u.id));
    } else if (userBatchAction === 'lock') {
      updatedUsers = allUsers.map(u => {
        if (selectedUserIds.has(u.id)) {
          return { ...u, status: 'locked' };
        }
        return u;
      });
    } else if (userBatchAction === 'activate') {
      updatedUsers = allUsers.map(u => {
        if (selectedUserIds.has(u.id)) {
          return { ...u, status: 'active' };
        }
        return u;
      });
    } else if (userBatchAction === 'suspend') {
      updatedUsers = allUsers.map(u => {
        if (selectedUserIds.has(u.id)) {
          return { ...u, status: 'suspended' };
        }
        return u;
      });
    }

    try {
      storageHelper.saveUsers(updatedUsers, currentUser);
      showFeedback(`Successfully updated status for ${selectedUserIds.size} user profiles.`);
      reloadData();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };



  // Delete User (Single)
  const handleDeleteUser = (userId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    const dbUsers = readStorage(KEYS.USERS) || [];
    const target = dbUsers.find(u => u.id === userId);
    if (!target) return;

    if (target.id === currentUser.id || target.role === 'Admin') {
      showFeedback('Access Denied: Protected profiles.', 'error');
      return;
    }

    const filtered = dbUsers.filter(u => u.id !== userId);
    try {
      storageHelper.saveUsers(filtered, currentUser);
      reloadData();
      showFeedback(`User account "${target.name}" deleted.`);
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  // Enroll Staff Curator
  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      showFeedback('Please fill out all staff fields.', 'error');
      return;
    }

    const dbUsers = readStorage(KEYS.USERS) || [];
    const emailExists = dbUsers.some(u => u.email.toLowerCase() === staffForm.email.toLowerCase());
    if (emailExists) {
      showFeedback('This email address is already in use.', 'error');
      return;
    }

    const newStaff = {
      id: `user-staff-${Date.now()}`,
      name: staffForm.name,
      email: staffForm.email,
      passwordHash: hashPassword(staffForm.password),
      role: 'Staff',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    dbUsers.push(newStaff);
    try {
      storageHelper.saveUsers(dbUsers, currentUser);
      showFeedback(`Curator "${newStaff.name}" successfully enrolled.`);
      setStaffForm({ name: '', email: '', password: '' });
      reloadData();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  // Publish Announcement
  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      showFeedback('Notice fields cannot be left empty.', 'error');
      return;
    }

    const dbAnnouncements = readStorage(KEYS.ANNOUNCEMENTS) || [];
    const newAnn = {
      id: `ann-${Date.now()}`,
      title: announcementForm.title,
      content: announcementForm.content,
      date: new Date().toISOString()
    };

    dbAnnouncements.unshift(newAnn);
    writeStorage(KEYS.ANNOUNCEMENTS, dbAnnouncements);
    showFeedback('Announcement bulletin notice updated.');
    setAnnouncementForm({ title: '', content: '' });
    reloadData();
  };

  // Delete Announcement
  const handleDeleteAnnouncement = (id) => {
    const dbAnnouncements = readStorage(KEYS.ANNOUNCEMENTS) || [];
    const filtered = dbAnnouncements.filter(a => a.id !== id);
    writeStorage(KEYS.ANNOUNCEMENTS, filtered);
    showFeedback('Announcement removed.');
    reloadData();
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const dbSettings = readStorage(KEYS.SETTINGS) || {};
    dbSettings.announcementTicker = tickerText;
    dbSettings.allowNewRegistrations = registrationsOpen;

    writeStorage(KEYS.SETTINGS, dbSettings);
    showFeedback('Global preferences written to system storage.');
    reloadData();
  };

  // Open Product Modal
  const openProductEditModal = (product) => {
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
      price: product.price,
      stock: product.stock
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Single)
  const handleProductEditSubmit = (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(productForm.price);
    const parsedStock = parseInt(productForm.stock);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showFeedback('Price must be greater than 0.', 'error');
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      showFeedback('Stock count cannot be negative.', 'error');
      return;
    }

    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const index = dbProducts.findIndex(p => p.id === editingProduct.id);
    if (index === -1) {
      showFeedback('Listing not found.', 'error');
      return;
    }

    const updated = {
      ...dbProducts[index],
      title: productForm.title,
      category: productForm.category,
      creator: productForm.creator,
      description: productForm.description,
      imageUrl: productForm.imageUrl,
      genre: productForm.genre,
      releaseYear: productForm.releaseYear,
      language: productForm.language,
      price: parsedPrice,
      stock: parsedStock
    };

    dbProducts[index] = updated;
    try {
      storageHelper.saveProducts(dbProducts, currentUser);
      showFeedback(`Product "${updated.title}" catalog attributes updated.`);
      setIsProductModalOpen(false);
      reloadData();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const handleDeleteProduct = (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmDelete) return;

    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const filtered = dbProducts.filter(p => p.id !== productId);
    try {
      storageHelper.saveProducts(filtered, currentUser);
      showFeedback('Product listing removed.');
      reloadData();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  // Calculated overall metrics
  const totalSpentAll = orders.reduce((sum, ord) => sum + ord.total, 0);
  const filteredProducts = getFilteredProducts();
  const filteredUsers = getFilteredUsers();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER BANNER */}
      <div style={{ 
        backgroundColor: 'var(--panel)', 
        border: '1px solid var(--hairline)', 
        padding: '1.25rem 2rem', 
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', letterSpacing: '0.03em', color: 'var(--signal)', margin: 0 }}>
            ORBIT SITE ADMINISTRATION
          </h2>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            ROLE: SUPERUSER/ADMIN
          </span>
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          fontFamily: 'var(--font-mono)', 
          color: 'var(--text-muted)', 
          borderTop: '1px solid var(--hairline)', 
          paddingTop: '0.5rem', 
          marginTop: '0.25rem' 
        }}>
          Site Administration &gt; <span style={{ color: 'var(--text)' }}>{activeTab.toUpperCase()}</span>
        </div>
      </div>

      {feedback.text && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: feedback.type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(200, 255, 0, 0.1)',
          border: `1px solid ${feedback.type === 'error' ? '#FF4D6D' : 'var(--signal)'}`,
          color: feedback.type === 'error' ? '#FF4D6D' : 'var(--text)',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          {feedback.text}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Total Accounts
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {users.length}
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Total Products Listed
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {products.length}
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Total Simulated Invoices
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {orders.length}
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Total System Volume
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                ${totalSpentAll.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '2rem',
            lineHeight: '1.6'
          }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              System Diagnostics
            </h3>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>[SYSTEM STATUS] ONLINE - LOCALSTORAGE CORE HEALTHY</div>
              <div>[SETTINGS ADAPTING] ALLOW REGISTRATIONS: {registrationsOpen ? 'TRUE' : 'FALSE'}</div>
              <div>[ACTIVE ANNOUNCEMENTS] COUNT: {announcements.length}</div>
              <div>[DEMO DATA INTEGRITY] LOADED SEED FILE VERIFIED: {products.length > 0 ? 'TRUE' : 'EMPTY'}</div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB - Django Admin Layout */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Main Action + Table block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Batch Action header */}
            <div style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--hairline)',
              padding: '0.75rem 1.25rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action:</span>
                <select 
                  value={userBatchAction}
                  onChange={(e) => setUserBatchAction(e.target.value)}
                  style={{
                    backgroundColor: 'var(--ink)',
                    border: '1px solid var(--hairline)',
                    color: 'var(--text)',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.85rem',
                    borderRadius: '3px'
                  }}
                >
                  <option value="">---------</option>
                  <option value="lock">Lock selected profiles</option>
                  <option value="activate">Activate selected profiles</option>
                  <option value="suspend">Suspend selected profiles</option>
                  <option value="delete">Delete selected profiles</option>
                </select>
                <button 
                  onClick={handleExecuteUserBatch}
                  style={{
                    backgroundColor: 'var(--signal)',
                    color: 'var(--signal-text)',
                    border: 'none',
                    padding: '0.35rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                >
                  Go
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {selectedUserIds.size} of {filteredUsers.length} selected
              </span>
            </div>

            {/* Zero padding dense table */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--panel-raised)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        onChange={handleSelectAllUsers}
                        checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.filter(u => u.id !== currentUser.id && u.role !== 'Admin').length}
                      />
                    </th>
                    <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>EMAIL</th>
                    <th style={{ padding: '0.75rem 1rem' }}>NAME</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px' }}>ROLE</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px' }}>STATUS</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const isSelf = user.id === currentUser.id;
                    const isProtected = user.role === 'Admin';
                    const isChecked = selectedUserIds.has(user.id);
                    return (
                      <tr 
                        key={user.id} 
                        style={{ 
                          borderBottom: '1px solid var(--hairline)',
                          backgroundColor: isChecked ? 'rgba(200, 255, 0, 0.02)' : 'transparent' 
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            disabled={isSelf || isProtected}
                            checked={isChecked}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{user.id}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{user.email}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>
                          {user.name} {isSelf && '(You)'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{user.role}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            color: user.status === 'suspended' ? '#FF4D6D' : user.status === 'locked' ? '#FFC94D' : '#00D9C0',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase'
                          }}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          {!isSelf && !isProtected ? (
                            <button 
                              onClick={() => handleDeleteUser(user.id)} 
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FF4D6D',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '0.8rem'
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No profiles matched these diagnostic filter logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Diagnostics count */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {filteredUsers.length} users listed
            </div>

          </div>

          {/* Right Hand Filters */}
          <aside style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '1.25rem'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--signal)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--hairline)',
              paddingBottom: '0.5rem'
            }}>
              Filter
            </h3>
            
            {/* By Role */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                By Role
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {['All', 'Buyer', 'Seller', 'Staff', 'Admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: filterRole === role ? 'var(--text)' : 'var(--text-muted)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '2px 0',
                      textDecoration: filterRole === role ? 'underline' : 'none',
                      fontWeight: filterRole === role ? 'bold' : 'normal'
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* By Status */}
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                By Status
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {['All', 'active', 'locked', 'suspended'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: filterStatus === status ? 'var(--text)' : 'var(--text-muted)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '2px 0',
                      textDecoration: filterStatus === status ? 'underline' : 'none',
                      fontWeight: filterStatus === status ? 'bold' : 'normal'
                    }}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

          </aside>

        </div>
      )}

      {/* PRODUCTS TAB - Django Admin Layout */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Main Action + Table block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Batch Action header */}
            <div style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--hairline)',
              padding: '0.75rem 1.25rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action:</span>
                <select 
                  value={productBatchAction}
                  onChange={(e) => setProductBatchAction(e.target.value)}
                  style={{
                    backgroundColor: 'var(--ink)',
                    border: '1px solid var(--hairline)',
                    color: 'var(--text)',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.85rem',
                    borderRadius: '3px'
                  }}
                >
                  <option value="">---------</option>
                  <option value="delete">Delete selected listings</option>
                  <option value="restock_10">Set stock to 10 units</option>
                  <option value="deplete_stock">Set stock to 0 (Out of Stock)</option>
                  <option value="markdown_50">Markdown price by 50%</option>
                </select>
                <button 
                  onClick={handleExecuteProductBatch}
                  style={{
                    backgroundColor: 'var(--signal)',
                    color: 'var(--signal-text)',
                    border: 'none',
                    padding: '0.35rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                >
                  Go
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {selectedProductIds.size} of {filteredProducts.length} selected
              </span>
            </div>

            {/* Zero padding dense table */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--panel-raised)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        onChange={handleSelectAllProducts}
                        checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                      />
                    </th>
                    <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TITLE</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px' }}>CATEGORY</th>
                    <th style={{ padding: '0.75rem 1rem', width: '80px', textAlign: 'right' }}>PRICE</th>
                    <th style={{ padding: '0.75rem 1rem', width: '80px', textAlign: 'center' }}>STOCK</th>
                    <th style={{ padding: '0.75rem 1rem', width: '180px' }}>MERCH</th>
                    <th style={{ padding: '0.75rem 1rem', width: '120px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const spineColor = categoryColors[product.category] || 'var(--text-muted)';
                    const isChecked = selectedProductIds.has(product.id);
                    return (
                      <tr 
                        key={product.id} 
                        style={{ 
                          borderBottom: '1px solid var(--hairline)',
                          backgroundColor: isChecked ? 'rgba(200, 255, 0, 0.02)' : 'transparent' 
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleSelectProduct(product.id)}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{product.id}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{product.title}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ color: spineColor, fontWeight: 'bold' }}>{product.category}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          ${product.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                          {product.stock}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{product.sellerName}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => openProductEditModal(product)} 
                              style={{ background: 'none', border: 'none', color: 'var(--signal)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)} 
                              style={{ background: 'none', border: 'none', color: '#FF4D6D', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No product listings logged for this filter query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Diagnostics count */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {filteredProducts.length} listings displayed
            </div>

          </div>

          {/* Right Hand Filters */}
          <aside style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '1.25rem'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--signal)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--hairline)',
              paddingBottom: '0.5rem'
            }}>
              Filter
            </h3>
            
            {/* By Category */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                By Category
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {['All', 'Anime', 'Manga', 'Book', 'Comic', 'Movie'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: filterCategory === cat ? 'var(--text)' : 'var(--text-muted)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '2px 0',
                      textDecoration: filterCategory === cat ? 'underline' : 'none',
                      fontWeight: filterCategory === cat ? 'bold' : 'normal'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* By Stock level */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                By Stock
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  { label: 'All', val: 'All' },
                  { label: 'Out of Stock (0)', val: 'Out' },
                  { label: 'Low Stock (< 5)', val: 'Low' },
                  { label: 'Sufficient Stock (5+)', val: 'High' }
                ].map(stock => (
                  <button
                    key={stock.val}
                    onClick={() => setFilterStock(stock.val)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: filterStock === stock.val ? 'var(--text)' : 'var(--text-muted)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '2px 0',
                      textDecoration: filterStock === stock.val ? 'underline' : 'none',
                      fontWeight: filterStock === stock.val ? 'bold' : 'normal'
                    }}
                  >
                    {stock.label}
                  </button>
                ))}
              </div>
            </div>

            {/* By Price tier */}
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                By Price
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  { label: 'All prices', val: 'All' },
                  { label: 'Under $15.00', val: 'Under15' },
                  { label: 'At or Over $15.00', val: 'Over15' }
                ].map(price => (
                  <button
                    key={price.val}
                    onClick={() => setFilterPrice(price.val)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: filterPrice === price.val ? 'var(--text)' : 'var(--text-muted)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '2px 0',
                      textDecoration: filterPrice === price.val ? 'underline' : 'none',
                      fontWeight: filterPrice === price.val ? 'bold' : 'normal'
                    }}
                  >
                    {price.label}
                  </button>
                ))}
              </div>
            </div>

          </aside>

        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--hairline)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--signal)', fontWeight: 'bold' }}>Invoice ID: {order.id}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Buyer Customer: {order.userName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Receipt: {order.receiptNumber}</div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  <div>Invoice Total: <strong>${order.total.toFixed(2)}</strong></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(order.date).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>{item.title} (x{item.quantity})</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--panel)', border: '1px dashed var(--hairline)', borderRadius: '6px' }}>
              No simulated transactions logged yet.
            </div>
          )}
        </div>
      )}

      {/* STAFF MANAGEMENT TAB */}
      {activeTab === 'staff' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }} className="staff-grid">
          {/* List of curators */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--panel-raised)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Name / ID</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Roster Role</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'Staff').map(staff => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{staff.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{staff.email}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ color: 'var(--signal)', fontWeight: 'bold', fontSize: '0.8rem' }}>STAFF</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteUser(staff.id)} 
                        className="btn btn-danger"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: '#351717', color: '#FF4D6D', border: '1px solid #FF4D6D' }}
                      >
                        Remove Curator
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Staff form */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '2rem', borderRadius: '6px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Enroll Curator
            </h3>
            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Key</label>
                <input 
                  type="email" 
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="form-input"
                  placeholder="e.g. staff2@orbit.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Roster Password</label>
                <input 
                  type="password" 
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Register Staff Curator
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }} className="staff-grid">
          {/* Announcements list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map(ann => (
              <div key={ann.id} style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px', position: 'relative' }}>
                <button 
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#FF4D6D', cursor: 'pointer', fontSize: '1rem' }}
                  title="Delete Announcement"
                >
                  ✕
                </button>
                <h4 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>{ann.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{ann.content}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Published: {new Date(ann.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>

          {/* Add form */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '2rem', borderRadius: '6px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Publish Notice
            </h3>
            <form onSubmit={handleAddAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notice Title</label>
                <input 
                  type="text" 
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notice Body Content</label>
                <textarea 
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="form-textarea"
                  rows="4"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM UTILITIES TAB */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* General Site settings */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '2rem', borderRadius: '6px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Site Preferences
            </h3>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Marquee Banner Ticker message</label>
                <input 
                  type="text" 
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="reg-check"
                  checked={registrationsOpen}
                  onChange={(e) => setRegistrationsOpen(e.target.checked)}
                  style={{ accentColor: 'var(--signal)', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="reg-check" style={{ fontSize: '0.9rem', color: 'var(--text)', cursor: 'pointer', userSelect: 'none' }}>
                  Allow New Account Registrations
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Save System Preferences
              </button>
            </form>
          </div>

          {/* Reset Demo Data controls */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid #FF4D6D',
            padding: '2rem',
            borderRadius: '6px',
            boxShadow: '0 0 10px rgba(255, 77, 109, 0.05)'
          }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', textTransform: 'uppercase', color: '#FF4D6D', marginBottom: '1rem' }}>
              DANGER ZONE
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Reverting data clears all custom users, products, wishlists, shopping carts, and simulated order files, restoring the database back to standard seed settings.
            </p>
            <button 
              onClick={() => {
                const check = window.confirm('Revert all demo database data? This clears current sessions.');
                if (check) resetDemoData();
              }} 
              className="btn"
              style={{
                width: '100%',
                background: '#351717',
                border: '1px solid #FF4D6D',
                color: '#FF4D6D',
                fontWeight: 'bold',
                padding: '0.85rem'
              }}
            >
              Reset Simulated Database
            </button>
          </div>

        </div>
      )}

      {/* PRODUCT EDIT MODAL FOR ADMINS (ANY PRODUCT) */}
      {isProductModalOpen && (
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
            padding: '2.5rem'
          }}>
            <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', color: 'var(--signal)', margin: 0 }}>
                ADMIN PRODUCT CONTROL
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleProductEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <label className="form-label">Description</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Genre</label>
                  <input 
                    type="text" 
                    value={productForm.genre}
                    onChange={(e) => setProductForm({ ...productForm, genre: e.target.value })}
                    className="form-input"
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
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Product (Admin)</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
