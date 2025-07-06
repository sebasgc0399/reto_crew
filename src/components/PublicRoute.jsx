// src/components/PublicRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras carga la autenticación, no renderices nada (o un spinner)
  if (loading) return null;

  // Si hay usuario, redirige al Dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  // Si no hay usuario, muestra la ruta pública (Home, Login, etc)
  return children;
}
