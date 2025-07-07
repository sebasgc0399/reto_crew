import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import {
  doc,
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
  const [name, setName] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setName(user.displayName || '');
    }
  }, [user, loading]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', msg: '' });

    try {
      // 1) Actualiza el displayName en Firebase Auth
      await updateProfile(auth.currentUser, { displayName: name });

      // 2) Actualiza el documento en users/{uid}
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name });

      // 3) Actualiza todos los participantes donde uid === user.uid
      //    Usa un batch para agrupar las actualizaciones
      const batch = writeBatch(db);
      const participantsQ = query(
        collectionGroup(db, 'participants'),
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(participantsQ);

      snaps.forEach(partSnap => {
        batch.update(partSnap.ref, { name });
      });

      // Ejecuta el batch
      await batch.commit();

      setStatus({ type: 'success', msg: 'Nombre actualizado 👍' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Error al guardar cambios.' });
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

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        {status.msg && (
          <p
            className={
              status.type === 'success' ? 'status status--success' : 'status status--error'
            }
          >
            {status.msg}
          </p>
        )}
      </form>
    </div>
  );
}
