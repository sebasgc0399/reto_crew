// src/pages/ChallengeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import {
  collection,
  doc,
  addDoc,
  setDoc,
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
import '../components/form/FormField.css';

export default function ChallengeForm() {
  const { id }       = useParams();
  const isEdit       = Boolean(id);
  const navigate     = useNavigate();
  const { user }     = useAuth();

  // Estados
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState(null);
  const [endDate, setEndDate]         = useState(null);
  const [userWeight, setUserWeight]   = useState('');  // Tu peso
  const [loading, setLoading]         = useState(isEdit);
  const [error, setError]             = useState('');

  // Carga datos si estamos editando (opcional: podrías cargar peso previo)
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'challenges', id));
        if (!snap.exists()) {
          setError('Reto no encontrado.');
          setLoading(false);
          return;
        }
        const data = snap.data();
        setTitle(data.title);
        setDescription(data.description || '');
        setStartDate(new Date(data.startDate.seconds * 1000));
        setEndDate(new Date(data.endDate.seconds * 1000));
        // Si quieres cargar el peso actual del participante:
        const pSnap = await getDoc(
          doc(db, 'challenges', id, 'participants', user.uid)
        );
        if (pSnap.exists()) {
          setUserWeight(pSnap.data().weight);
        }
      } catch (e) {
        console.error(e);
        setError('Error cargando datos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, user.uid]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Validación básica
    if (
      !title ||
      !startDate ||
      !endDate ||
      !userWeight
    ) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    try {
      const payload = {
        title,
        description,
        startDate: Timestamp.fromDate(startDate),
        endDate:   Timestamp.fromDate(endDate)
      };

      let chRef;
      if (isEdit) {
        // EDITAR reto (no tocamos refWeight aquí)
        await updateDoc(doc(db, 'challenges', id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        chRef = { id };
      } else {
        // CREAR reto
        chRef = await addDoc(collection(db, 'challenges'), {
          ...payload,
          createdBy:  user.uid,
          createdAt: serverTimestamp()
        });
      }

      // AUTO-INSCRIBIR al creador
      const weight      = Number(userWeight);
      await setDoc(
        doc(db, 'challenges', chRef.id, 'participants', user.uid),
        {
          uid:      user.uid,
          weight,
          joinedAt: serverTimestamp()
        }
      );

      // Calcular promedio de pesos solo del creador (al principio)
      if (!isEdit) {
        await updateDoc(doc(db, 'challenges', chRef.id), {
          refWeight: weight
        });
      }

      navigate('/challenges', { replace: true });
    } catch (e) {
      console.error(e);
      setError('No se pudo guardar el reto. Intenta de nuevo.');
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

        {/* Solo pedimos tu peso */}
        <NumberField
          label="Tu peso (kg)"
          value={userWeight}
          onChange={setUserWeight}
          required
          tooltip={
            'Tu peso se usa luego para normalizar el esfuerzo relativo en el reto.'
          }
        />

        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Guardar cambios' : 'Crear reto'}
        </button>
      </form>
    </div>
  );
}
