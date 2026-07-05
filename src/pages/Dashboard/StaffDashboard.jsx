import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readStorage, KEYS } from '../../utils/localStorage';
import { storageHelper } from '../../utils/storageHelper';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const StaffDashboard = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // DB States
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState('');

  // Selection states
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  // Batch actions
  const [productBatchAction, setProductBatchAction] = useState('');
  const [userBatchAction, setUserBatchAction] = useState('');

  // Right-hand filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStock, setFilterStock] = useState('All'); // All | Out | Low | High

  const [filterRole, setFilterRole] = useState('All'); // All | Buyer | Seller
  const [filterStatus, setFilterStatus] = useState('All'); // All | active | locked | suspended

  // Load database state
  const reloadData = () => {
    // RLS limits queries to Staff-allowed users/products (excludes Admins, etc.)
    setUsers(storageHelper.getUsers(currentUser));
    setProducts(storageHelper.getProducts(currentUser));
    setOrders(readStorage(KEYS.ORDERS) || []);
    
    // Reset selection sets
    setSelectedProductIds(new Set());
    setSelectedUserIds(new Set());
  };

  useEffect(() => {
    reloadData();
  }, [activeTab, filterCategory, filterStock, filterRole, filterStatus]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  // Checkbox handlers for Products
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

  // Checkbox handlers for Users
  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      // Omit Admins and Staff from staff-moderated selections
      const ids = getFilteredUsers()
        .filter(u => u.role !== 'Admin' && u.role !== 'Staff')
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

  // Batch actions
  const handleExecuteProductBatch = () => {
    if (selectedProductIds.size === 0) {
      showFeedback('No items selected.');
      return;
    }

    if (productBatchAction !== 'delete') {
      showFeedback('Please select a valid action.');
      return;
    }

    const allProducts = readStorage(KEYS.PRODUCTS) || [];
    const confirmDelete = window.confirm(`Delete the ${selectedProductIds.size} selected listings?`);
    if (!confirmDelete) return;

    const filtered = allProducts.filter(p => !selectedProductIds.has(p.id));
    try {
      storageHelper.saveProducts(filtered, currentUser);
      showFeedback(`Successfully deleted ${selectedProductIds.size} product listings.`);
      reloadData();
    } catch (error) {
      showFeedback(error.message);
    }
  };

  const handleExecuteUserBatch = () => {
    if (selectedUserIds.size === 0) {
      showFeedback('No users selected.');
      return;
    }

    if (!userBatchAction) {
      showFeedback('Please select a user action.');
      return;
    }

    const allUsers = readStorage(KEYS.USERS) || [];
    let updatedUsers = [...allUsers];

    if (userBatchAction === 'lock') {
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
    }

    try {
      storageHelper.saveUsers(updatedUsers, currentUser);
      showFeedback(`Successfully updated status for ${selectedUserIds.size} user profiles.`);
      reloadData();
    } catch (error) {
      showFeedback(error.message);
    }
  };

  // Toggle user lock/unlock status (Single)
  const handleToggleUserLock = (userId) => {
    const dbUsers = readStorage(KEYS.USERS) || [];
    const index = dbUsers.findIndex(u => u.id === userId);
    
    if (index === -1) return;
    
    const targetUser = dbUsers[index];
    
    // Safety check: Staff cannot alter Admin or other Staff roles
    if (targetUser.role === 'Admin' || targetUser.role === 'Staff') {
      showFeedback('Access Denied: Staff cannot alter Admin or Staff parameters.');
      return;
    }

    const currentStatus = targetUser.status || 'active';
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    
    dbUsers[index].status = newStatus;
    try {
      storageHelper.saveUsers(dbUsers, currentUser);
      reloadData();
      showFeedback(`User account "${targetUser.name}" has been ${newStatus}.`);
    } catch (error) {
      showFeedback(error.message);
    }
  };

  // Remove listing (Single)
  const handleRemoveProduct = (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to remove this listing?');
    if (!confirmDelete) return;

    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const pToDelete = dbProducts.find(p => p.id === productId);
    
    if (!pToDelete) return;

    const filtered = dbProducts.filter(p => p.id !== productId);
    try {
      storageHelper.saveProducts(filtered, currentUser);
      reloadData();
      showFeedback(`Product listing "${pToDelete.title}" removed for moderation violation.`);
    } catch (error) {
      showFeedback(error.message);
    }
  };

  // Filters calculation
  const getFilteredProducts = () => {
    let list = [...products];

    if (filterCategory !== 'All') {
      list = list.filter(p => p.category === filterCategory);
    }

    if (filterStock === 'Out') {
      list = list.filter(p => p.stock === 0);
    } else if (filterStock === 'Low') {
      list = list.filter(p => p.stock > 0 && p.stock < 5);
    } else if (filterStock === 'High') {
      list = list.filter(p => p.stock >= 5);
    }

    return list;
  };

  const getFilteredUsers = () => {
    let list = [...users];

    // Staff only moderates Buyer and Seller
    list = list.filter(u => u.role === 'Buyer' || u.role === 'Seller');

    if (filterRole !== 'All') {
      list = list.filter(u => u.role === filterRole);
    }

    if (filterStatus !== 'All') {
      list = list.filter(u => u.status === filterStatus);
    }

    return list;
  };

  const filteredProducts = getFilteredProducts();
  const filteredUsers = getFilteredUsers();

  // Metrics
  const buyersCount = users.filter(u => u.role === 'Buyer').length;
  const sellersCount = users.filter(u => u.role === 'Seller').length;
  const activeListings = products.length;
  const ordersCompleted = orders.length;

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
            ROLE: STAFF CURATOR
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

      {feedback && (
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: 'rgba(255, 106, 61, 0.15)',
          border: '1px solid var(--signal)',
          borderRadius: '4px',
          color: 'var(--text)',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          {feedback}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Registered Buyers
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {buyersCount}
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Active Sellers
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {sellersCount}
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Active Shelf Items
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {activeListings}
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Orders Logged
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                {ordersCompleted}
              </span>
            </div>
          </div>

          {/* Quick instructions */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '2rem',
            lineHeight: '1.6'
          }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Moderator Directives
            </h3>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <li>Browse <strong>Listing Moderation</strong> to delete items that violate physical-media policies.</li>
              <li>Under <strong>User Operations</strong>, inspect merchant status and lock accounts suspected of malicious listings.</li>
              <li>Staff hold diagnostic privileges but cannot modify Admin rosters or alter global settings parameter ticks.</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODERATION TAB - Django Style */}
      {activeTab === 'moderation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Action Header */}
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
                    <th style={{ padding: '0.75rem 1rem', width: '180px' }}>MERCH</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px', textAlign: 'right' }}>ACTIONS</th>
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
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{product.sellerName}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleRemoveProduct(product.id)} 
                            style={{ background: 'none', border: 'none', color: '#FF4D6D', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No product listings logged for moderation.
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
            <div>
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

          </aside>

        </div>
      )}

      {/* USERS OPERATIONS TAB - Django Style */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Action Header */}
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
                        checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                      />
                    </th>
                    <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>EMAIL</th>
                    <th style={{ padding: '0.75rem 1rem' }}>NAME</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px' }}>ROLE</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px' }}>STATUS</th>
                    <th style={{ padding: '0.75rem 1rem', width: '120px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const isChecked = selectedUserIds.has(user.id);
                    const isLocked = user.status === 'locked' || user.status === 'suspended';
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
                            checked={isChecked}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{user.id}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{user.email}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{user.name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{user.role}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            color: isLocked ? '#FF4D6D' : '#00D9C0',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase'
                          }}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleToggleUserLock(user.id)} 
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isLocked ? '#00D9C0' : '#FF4D6D',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            {isLocked ? 'Activate' : 'Lock'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No profiles matched the current filter conditions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Diagnostics count */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {filteredUsers.length} user profiles displayed
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
                {['All', 'Buyer', 'Seller'].map(role => (
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

    </div>
  );
};

export default StaffDashboard;
