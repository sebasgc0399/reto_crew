import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth }                      from '../contexts/AuthContext';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db }                           from '../firebaseConfig';
import NumberField                      from '../components/form/NumberField';
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
    (async () => {
      // 1) Traer datos básicos del reto
      const chSnap = await getDoc(doc(db, 'challenges', id));
      if (!chSnap.exists()) {
        setError('Reto no encontrado.');
        setLoading(false);
        return;
      }
      setChallenge({ id: chSnap.id, ...chSnap.data() });

      // 2) Verificar si ya está inscrito
      const partSnap = await getDoc(
        doc(db, 'challenges', id, 'participants', user.uid)
      );
      if (partSnap.exists()) {
        // Si ya se unió, lo mandamos de vuelta al detalle
        navigate(`/challenges/${id}`, { replace: true });
        return;
      }

      setLoading(false);
    })();
  }, [id, user.uid, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!weight) {
      setError('Por favor ingresa tu peso.');
      return;
    }
    try {
      // 3) Guardar en subcolección participants
      await setDoc(
        doc(db, 'challenges', id, 'participants', user.uid),
        {
          uid:      user.uid,
          weight:   Number(weight),
          joinedAt: serverTimestamp()
        }
      );

      // 4) Volver al detalle del reto
      navigate(`/challenges/${id}`, { replace: true });
    } catch (e) {
      console.error(e);
      setError('No fue posible inscribirte. Intenta de nuevo.');
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="join-challenge-container">
      <h2>Unirme a: {challenge.title}</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="join-challenge-form">
        <NumberField
          label="Tu peso (kg)"
          value={weight}
          onChange={setWeight}
          required
          tooltip="Tu peso corporal se usa para normalizar el esfuerzo relativo"
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
