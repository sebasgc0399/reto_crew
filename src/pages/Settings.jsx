// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import Loader from '../components/Loader';
import TextField from '../components/form/TextField';
import NumberField from '../components/form/NumberField';
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

    // 2) Verificar unicidad del nombre
   const nameTrim = name.trim();
   const nameQ = query(collection(db, 'users'), where('name', '==', nameTrim));
   const nameSnap = await getDocs(nameQ);
   // Si existe algún otro usuario con ese nombre, bloqueamos
   if (nameSnap.docs.some(docSnap => docSnap.id !== user.uid)) {
     setStatus({ type: 'error', msg: 'Ese nombre ya está en uso, elige otro.' });
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
        <TextField
          label="Tu nombre"
          value={name}
          onChange={setName}
          required
          tooltip="Debe ser único entre todos los usuarios"
          disabled={saving}
          maxLength={25}
          validateRegex={/^[\p{L}\p{N} ]*$/u}
        />

        <NumberField
          label="Tu peso (kg)"
          value={weight}
          onChange={val => {
            if (val === '') {
              setWeight('');
            } else {
              setWeight(Number(val));
            }
          }}
          required
          tooltip="Tu peso se usa para normalizar el esfuerzo"
          disabled={saving}
          min={1}
          max={999}
        />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        {status.msg && (
          <p className={`status status--${status.type}`}>
            {status.msg}
          </p>
        )}
      </form>
    </div>
  );
}
