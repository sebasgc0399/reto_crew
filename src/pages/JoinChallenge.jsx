// src/pages/JoinChallenge.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import NumberField from '../components/form/NumberField';
import Loader      from '../components/Loader';
import './JoinChallenge.css';

export default function JoinChallenge() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [weight, setWeight]       = useState('');
  const [error, setError]         = useState('');

  useEffect(() => {
    // cargar reto, comprobar inscripción y peso de usuario
    (async () => {
      setLoading(true);
      try {
        // 1) Leer reto
        const chSnap = await getDoc(doc(db, 'challenges', id));
        if (!chSnap.exists()) {
          setError('Reto no encontrado.');
          setLoading(false);
          return;
        }
        setChallenge({ id: chSnap.id, ...chSnap.data() });

        // 2) ¿Ya inscrito?
        const partRef = doc(db, 'challenges', id, 'participants', user.uid);
        if ((await getDoc(partRef)).exists()) {
          navigate(`/challenges/${id}`, { replace: true });
          return;
        }

        // 3) ¿Tiene peso en users/{uid}?
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        if (userData.weight != null) {
          // Auto-inscribir con el peso almacenado
          await setDoc(partRef, {
            uid:      user.uid,
            name:     user.displayName || '',
            weight:   userData.weight,
            joinedAt: serverTimestamp()
          });
          navigate(`/challenges/${id}`, { replace: true });
          return;
        }

        // 4) Si llegó aquí, no hay peso almacenado: mostrar formulario
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Error cargando datos.');
        setLoading(false);
      }
    })();
  }, [id, user.uid, user.displayName, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!weight || Number(weight) <= 0) {
      setError('Por favor ingresa un peso válido.');
      return;
    }

    setLoading(true);
    try {
      const w = Number(weight);
      const userRef = doc(db, 'users', user.uid);
      // 1) Guardar peso en users/{uid}
      await updateDoc(userRef, { weight: w });

      // 2) Inscribir en participants
      const partRef = doc(db, 'challenges', id, 'participants', user.uid);
      await setDoc(partRef, {
        uid:      user.uid,
        name:     user.displayName || '',
        weight:   w,
        joinedAt: serverTimestamp()
      });

      navigate(`/challenges/${id}`, { replace: true });
    } catch (e) {
      console.error(e);
      setError('No fue posible inscribirte. Intenta de nuevo.');
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Cargando…" />;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="join-challenge-container">
      <h2>Únete a: {challenge.title}</h2>

      <form onSubmit={handleSubmit} className="join-challenge-form">
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
          tooltip="Tu peso corporal se usa para normalizar el esfuerzo relativo"
          min={1}
          max={999}
        />

        <button type="submit" className="btn btn-primary">
          Unirme al reto
        </button>
        <Link to={`/challenges/${id}`} className="btn btn-link">
          Volver
        </Link>
      </form>
    </div>
  );
}
