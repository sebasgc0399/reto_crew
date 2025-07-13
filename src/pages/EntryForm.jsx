// src/pages/EntryForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import { useAuth }                     from '../contexts/AuthContext';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { calcularPuntos }              from '../utils/points';
import { db }                          from '../firebaseConfig';
import NumberField                      from '../components/form/NumberField';
import Loader                          from '../components/Loader';
import './EntryForm.css';

export default function EntryForm() {
  const { id: chId }   = useParams();
  const { user }       = useAuth();
  const navigate       = useNavigate();

  const [value, setValue]         = useState('');
  const [challenge, setChallenge] = useState(null);
  const [weight, setWeight]       = useState(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1) Leer datos del reto
      const chSnap = await getDoc(doc(db, 'challenges', chId));
      if (!chSnap.exists()) {
        setError('Reto no encontrado');
        setLoading(false);
        return;
      }
      setChallenge(chSnap.data());

      // 2) Leer tu propio participante para obtener tu peso
      const pSnap = await getDoc(
        doc(db, 'challenges', chId, 'participants', user.uid)
      );
      if (!pSnap.exists()) {
        setError('No estás inscrito en este reto');
        setLoading(false);
        return;
      }
      setWeight(pSnap.data().weight);
      setLoading(false);
    }
    fetchData();
  }, [chId, user.uid]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!value) {
      setError(`Introduce un valor en ${challenge.activity.unit}`);
      return;
    }

    try {
      const base = Number(value);
      const {
        activity,
        refWeight,
        weightBased
      } = challenge;

      // Determinar los parámetros para calcular puntos
      const pesoUsuario    = weightBased ? weight : 1;
      const pesoReferencia = weightBased ? refWeight : 1;
      const valorMaximo    = activity.valorMaximo;     // Debes tener este campo en Firestore
      const multiplier  = activity.multiplier;   // Y este también

      const pts = calcularPuntos(
        base,
        pesoUsuario,
        pesoReferencia,
        valorMaximo,
        multiplier
      );

      await addDoc(
        collection(db, 'challenges', chId, 'entries'),
        {
          userId:      user.uid,
          activityKey: activity.key,
          value:       base,
          unit:        activity.unit,
          multiplier,
          points:      pts,
          createdAt:   serverTimestamp()
        }
      );

      navigate(`/challenges/${chId}/dashboard`);
    } catch (e) {
      console.error(e);
      setError('Error guardando la entrada. Intenta de nuevo.');
    }
  };

  if (loading) return <Loader text="Cargando formulario…" />;
  if (error && !challenge) return <p className="error">{error}</p>;

  const { activity, refWeight, weightBased } = challenge;

  return (
    <div className="entry-form-container">
      <h2>Registrar {activity.label}</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="entry-form">
        <NumberField
          label={`${activity.label} (${activity.unit})`}
          value={value}
          onChange={setValue}
          required
          tooltip={activity.unit === 'km'
            ? 'Puedes usar decimales: p.ej. 2.50 km'
            : undefined
          }
          inputProps={{
            step: activity.unit === 'km' ? '0.01' : '1',
            placeholder: `Ej: 10 ${activity.unit}`,
            inputMode: activity.unit === 'km' ? 'decimal' : 'numeric'
          }}
        />

        {weightBased && (
          <p className="form-text">
            Tu peso: <strong>{weight} kg</strong> • Peso de referencia: <strong>{refWeight} kg</strong>
          </p>
        )}

        <button type="submit" className="btn btn-primary">
          Guardar entrada
        </button>
      </form>
    </div>
  );
}
