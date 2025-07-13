// src/components/PublicRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Loader from '../components/Loader';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasName, setHasName]   = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        setHasName(!!snap.data()?.name);
      })
      .catch(console.error)
      .finally(() => setChecking(false));
  }, [user]);

  if (loading || checking) return <Loader text="Cargando…" />;

  // Si el usuario ya tiene name en Firestore → dashboard
  if (user && hasName) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no hay usuario, o es nuevo y no tiene name → mostrar Home (y NamePopup)
  return children;
}
