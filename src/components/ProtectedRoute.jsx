import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute — protegge route in base a autenticazione e ruolo.
 * Può wrappare sia componenti normali (children) che Layout con Outlet.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  // Non autenticato → login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Ruolo non autorizzato → redirect alla propria area
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/member'} replace />;
  }

  // Se ci sono children (es. wrappa un Layout), li restituisce
  return children ?? <Outlet />;
}
