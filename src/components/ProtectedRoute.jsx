import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras carga la autenticación, no renderices nada (o un spinner)
  if (loading) return null;

  // Si no hay usuario, redirige al Home
  if (!user) return <Navigate to="/" replace />;

  return children;
}
