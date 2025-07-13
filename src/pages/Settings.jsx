// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  collectionGroup,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import Loader from '../components/Loader';
import './Settings.css';

export default function Settings() {
  const { user, loading } = useAuth();
  const [name, setName]   = useState('');
  const [weight, setWeight] = useState(''); 
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [saving, setSaving] = useState(false);

  // 1) Al montar, cargamos name y weight desde users/{uid}
  useEffect(() => {
    if (!loading && user) {
      (async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap    = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setName(data.name || '');
            setWeight(data.weight != null ? String(data.weight) : '');
          } else {
            setName(user.displayName || '');
            setWeight('');
          }
        } catch (err) {
          console.error('Error al leer usuario:', err);
        }
      })();
    }
  }, [user, loading]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', msg: '' });

    // Validación sencilla
    if (!name.trim() || isNaN(Number(weight)) || Number(weight) <= 0) {
      setStatus({ type: 'error', msg: 'Ingresa un nombre y un peso válido.' });
      setSaving(false);
      return;
    }

    try {
      // 2) Actualiza displayName en Firebase Auth
      await updateProfile(auth.currentUser, { displayName: name.trim() });

      // 3) Actualiza users/{uid}
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name:   name.trim(),
        weight: Number(weight)
      });

      // 4) Batch: actualiza todos tus documentos en participants
      const batch = writeBatch(db);
      const participantsQ = query(
        collectionGroup(db, 'participants'),
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(participantsQ);
      snaps.forEach(partSnap => {
        batch.update(partSnap.ref, { name: name.trim(), weight: Number(weight) });
      });
      await batch.commit();

      setStatus({ type: 'success', msg: '¡Cambios guardados!' });
    } catch (err) {
      console.error('Error guardando configuración:', err);
      setStatus({ type: 'error', msg: 'Hubo un error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Cargando…" />;

  return (
    <div className="settings-container">
      <h2>Configuraciones</h2>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Tu nombre</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
          required
        />

        <label htmlFor="weight">Tu peso (kg)</label>
        <input
          id="weight"
          type="number"
          min="1"
          step="0.1"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          disabled={saving}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        {status.msg && (
          <p
            className={
              status.type === 'success'
                ? 'status status--success'
                : 'status status--error'
            }
          >
            {status.msg}
          </p>
        )}
      </form>
    </div>
  );
}
