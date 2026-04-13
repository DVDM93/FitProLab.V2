import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect based on role if they don't have access
    return <Navigate to={userRole === 'admin' ? '/admin' : '/member'} replace />;
  }

  return children;
}
