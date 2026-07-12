import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Protected Route Guard
import ProtectedRoute from './components/Common/ProtectedRoute';

// Dashboard Layout
import DashboardShell from './components/Layout/DashboardShell';

// Reusable Loading Screen
import LoadingScreen from './components/Common/LoadingScreen';

// Pages (Lazy Loaded)
const LandingPage = React.lazy(() => import('./pages/Landing/LandingPage'));
const BrowsePage = React.lazy(() => import('./pages/Browse/BrowsePage'));
const ProductDetailsPage = React.lazy(() => import('./pages/ProductDetails/ProductDetailsPage'));
const CartPage = React.lazy(() => import('./pages/Cart/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/Checkout/CheckoutPage'));
const LoginPage = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Register/RegisterPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFound/NotFoundPage'));

// Dashboards (Lazy Loaded)
const BuyerDashboard = React.lazy(() => import('./pages/Dashboard/BuyerDashboard'));
const SellerDashboard = React.lazy(() => import('./pages/Dashboard/SellerDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/Dashboard/StaffDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/Dashboard/AdminDashboard'));

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
          <Suspense fallback={<LoadingScreen />}>
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
          </Suspense>
        </Router>
      </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
