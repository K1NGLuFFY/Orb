import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Protected Route Guard
import ProtectedRoute from './components/Common/ProtectedRoute';

// Dashboard Layout
import DashboardShell from './components/Layout/DashboardShell';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import BrowsePage from './pages/Browse/BrowsePage';
import ProductDetailsPage from './pages/ProductDetails/ProductDetailsPage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Dashboards
import BuyerDashboard from './pages/Dashboard/BuyerDashboard';
import SellerDashboard from './pages/Dashboard/SellerDashboard';
import StaffDashboard from './pages/Dashboard/StaffDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';

// Helper component to redirect /dashboard to correct role dashboard
const DashboardRedirect = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  
  switch (currentUser.role) {
    case 'Admin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'Staff':
      return <Navigate to="/dashboard/staff" replace />;
    case 'Seller':
      return <Navigate to="/dashboard/seller" replace />;
    case 'Buyer':
    default:
      return <Navigate to="/dashboard/buyer" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Guarded Checkout Flow */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute allowedRoles={['Buyer']}>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />

            {/* Guarded Dashboard Pages */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Seller', 'Buyer']}>
                  <DashboardShell />
                </ProtectedRoute>
              }
            >
              {/* Index redirect matching roles */}
              <Route index element={<DashboardRedirect />} />
              
              <Route 
                path="buyer" 
                element={
                  <ProtectedRoute allowedRoles={['Buyer']}>
                    <BuyerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="seller" 
                element={
                  <ProtectedRoute allowedRoles={['Seller']}>
                    <SellerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="staff" 
                element={
                  <ProtectedRoute allowedRoles={['Staff']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Error 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
