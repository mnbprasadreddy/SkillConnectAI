import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that restricts access to admin and super_admin users.
 * Must be used inside ProtectedRoute (which ensures user is authenticated).
 */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const role = user?.dbUser?.role;

  if (role !== 'admin' && role !== 'super_admin') {
    console.warn('[AdminRoute] Access denied — user role:', role);
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
