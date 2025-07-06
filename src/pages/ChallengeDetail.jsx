import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useAuth }                   from '../contexts/AuthContext';
import { db }                        from '../firebaseConfig';

import TextField     from '../components/form/TextField';
import TextAreaField from '../components/form/TextAreaField';
import DateField     from '../components/form/DateField';
import NumberField   from '../components/form/NumberField';

import './ChallengeForm.css';

export default function ChallengeForm() {
  const { id }       = useParams();
  const isEdit       = Boolean(id);
  const navigate     = useNavigate();
  const { user }     = useAuth();

  // Estados
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState(null);
  const [endDate, setEndDate]         = useState(null);
  const [refWeight, setRefWeight]     = useState(73.5);
  const [loading, setLoading]         = useState(isEdit);
  const [error, setError]             = useState('');

  // Carga en modo edición
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'challenges', id));
        if (!snap.exists()) {
          setError('Reto no encontrado.');
          return;
        }
        const data = snap.data();
        setTitle(data.title);
        setDescription(data.description || '');
        setStartDate(new Date(data.startDate.seconds * 1000));
        setEndDate(new Date(data.endDate.seconds * 1000));
        setRefWeight(data.refWeight);
      } catch (e) {
        console.error(e);
        setError('Error cargando datos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  // Envío
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!title || !startDate || !endDate || !refWeight) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    try {
      const payload = {
        title,
        description,
        startDate: Timestamp.fromDate(startDate),
        endDate:   Timestamp.fromDate(endDate),
        refWeight: Number(refWeight)
      };

      if (isEdit) {
        await updateDoc(doc(db, 'challenges', id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'challenges'), {
          ...payload,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
      }

      navigate('/challenges', { replace: true });
    } catch (e) {
      console.error(e);
      setError('No se pudo guardar el reto.');
    }
  };

  if (loading) return <p>Cargando datos…</p>;

  return (
    <div className="challenge-form-container">
      <h2>{isEdit ? 'Editar Reto' : 'Crear Nuevo Reto'}</h2>
      {error && <p className="error">{error}</p>}

      <form className="challenge-form" onSubmit={handleSubmit}>
        <TextField
          label="Título"
          value={title}
          onChange={setTitle}
          required
        />

        <TextAreaField
          label="Descripción"
          value={description}
          onChange={setDescription}
          rows={4}
        />

        <div className="date-group">
          <DateField
            label="Fecha inicio"
            selected={startDate}
            onChange={setStartDate}
            required
          />
          <DateField
            label="Fecha fin"
            selected={endDate}
            onChange={setEndDate}
            required
          />
        </div>

        <NumberField
          label="Peso de referencia (kg)"
          value={refWeight}
          onChange={setRefWeight}
          required
          tooltip={
            <>
              <strong>Peso de referencia:</strong><br/>
              Valor base (ej. 73.5 kg) para normalizar esfuerzo:<br/>
              <em>puntos = reps × multiplier × (peso / refWeight)</em>
            </>
          }
        />

        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Guardar cambios' : 'Crear reto'}
        </button>
      </form>
    </div>
  );
}
