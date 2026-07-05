import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardShell = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const getSidebarLinks = () => {
    switch (currentUser.role) {
      case 'Admin':
        return [
          { label: 'System Overview', path: '/dashboard/admin' },
          { label: 'Manage Users', path: '/dashboard/admin?tab=users' },
          { label: 'Manage Products', path: '/dashboard/admin?tab=products' },
          { label: 'All Orders', path: '/dashboard/admin?tab=orders' },
          { label: 'Staff Roster', path: '/dashboard/admin?tab=staff' },
          { label: 'Announcements', path: '/dashboard/admin?tab=announcements' },
          { label: 'System Settings', path: '/dashboard/admin?tab=settings' }
        ];
      case 'Staff':
        return [
          { label: 'Archival Console', path: '/dashboard/staff' },
          { label: 'Listing Moderation', path: '/dashboard/staff?tab=moderation' },
          { label: 'User Operations', path: '/dashboard/staff?tab=users' }
        ];
      case 'Seller':
        return [
          { label: 'Seller Overview', path: '/dashboard/seller' },
          { label: 'My Listings', path: '/dashboard/seller?tab=listings' },
          { label: 'Store Sales', path: '/dashboard/seller?tab=sales' }
        ];
      case 'Buyer':
      default:
        return [
          { label: 'Buyer Shelf', path: '/dashboard/buyer' },
          { label: 'My Wishlist', path: '/dashboard/buyer?tab=wishlist' },
          { label: 'Order History', path: '/dashboard/buyer?tab=orders' }
        ];
    }
  };

  const navLinks = getSidebarLinks();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="dashboard-shell">

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
        {/* Sidebar Header / Logo */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--signal)',
              letterSpacing: '0.05em'
            }}>ORBIT</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--hairline)',
              padding: '1px 4px',
              borderRadius: '2px'
            }}>DASH</span>
          </Link>
          {/* Close button visible only on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{
          flex: 1,
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            paddingLeft: '1rem',
            marginBottom: '0.5rem',
            display: 'block'
          }}>
            Navigation
          </span>

          {navLinks.map((link) => {
            const isTabActive = link.path.includes('?tab=')
              ? location.pathname + location.search === link.path
              : location.pathname === link.path && !location.search;

            return (
              <Link
                key={link.label}
                to={link.path}
                className={'sidebar-link ' + (isTabActive ? 'active' : 'inactive')}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <Link
            to="/browse"
            className="btn btn-secondary"
            style={{
              padding: '0.5rem',
              fontSize: '0.8rem',
              display: 'block',
              textAlign: 'center'
            }}
          >
            Browse Catalog
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">

        {/* TOPBAR */}
        <header className="topbar">
          {/* Hamburger menu button */}
          <button
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          {/* Page Section title (role-based) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--signal)',
              border: '1px solid rgba(132, 195, 24, 0.3)',
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'uppercase'
            }}>
              {currentUser.role} Control Panel
            </span>
          </div>

          {/* User profile header / Logout */}
          <div className="topbar-user">
            <div style={{ textAlign: 'right' }}>
              <span className="topbar-username">{currentUser.name}</span>
              <span className="topbar-email">{currentUser.email}</span>
            </div>

            {/* Vertical Separator */}
            <div className="topbar-separator" />

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem'
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardShell;
