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

const ACTIVITIES = {
  pushup: { label: 'Flexiones',   unit: 'reps', multiplier: 1.0, weightBased: true },
  pullup: { label: 'Dominadas',   unit: 'reps', multiplier: 1.0, weightBased: true },
  squat:  { label: 'Sentadillas', unit: 'reps', multiplier: 1.0, weightBased: true },
  run:    { label: 'Carrera',     unit: 'km',   multiplier: 1.0, weightBased: false },
};

export default function ChallengeForm() {
  const { id }       = useParams();
  const isEdit       = Boolean(id);
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState(null);
  const [endDate, setEndDate]         = useState(null);
  const [userWeight, setUserWeight]   = useState('');
  const [loading, setLoading]         = useState(isEdit);
  const [error, setError]             = useState('');

  // **nuevos**
  const [activityKey, setActivityKey]     = useState('pushup');
  const [activityLabel, setActivityLabel] = useState(ACTIVITIES.pushup.label);
  const [activityUnit, setActivityUnit]   = useState(ACTIVITIES.pushup.unit);
  const [multiplier, setMultiplier]       = useState(ACTIVITIES.pushup.multiplier);
  const [weightBased, setWeightBased]     = useState(ACTIVITIES.pushup.weightBased);

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

        // carga metadata de actividad
        if (data.activity) {
          const a = data.activity;
          setActivityKey(a.key);
          setActivityLabel(a.label);
          setActivityUnit(a.unit);
          setMultiplier(a.multiplier);
          setWeightBased(data.weightBased);
        }

        // carga peso previo del participante  
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

    if (!title || !startDate || !endDate || !userWeight) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    try {
      const payload = {
        title,
        description,
        startDate: Timestamp.fromDate(startDate),
        endDate:   Timestamp.fromDate(endDate),

        // **metadata dinámica**
        activity: { key: activityKey,
                    label: activityLabel,
                    unit: activityUnit,
                    multiplier: Number(multiplier) },
        weightBased
      };

      let chRef;
      if (isEdit) {
        await updateDoc(doc(db, 'challenges', id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        await updateDoc(
          doc(db, 'challenges', id, 'participants', user.uid),
          { name: user.displayName || '' }
        );
        chRef = { id };
      } else {
        chRef = await addDoc(collection(db, 'challenges'), {
          ...payload,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
      }

      // auto-inscribe al creador
      const wt = Number(userWeight);
      await setDoc(
        doc(db, 'challenges', chRef.id, 'participants', user.uid),
        { uid: user.uid, name: user.displayName || '', weight: wt, joinedAt: serverTimestamp() }
      );

      // inicializa refWeight con tu peso si es nuevo
      if (!isEdit) {
        await updateDoc(doc(db, 'challenges', chRef.id), { refWeight: wt });
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
          label="Título" value={title}
          onChange={setTitle} required
        />

        <TextAreaField
          label="Descripción" value={description}
          onChange={setDescription} rows={4}
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

        {/* nuevo selector */}
        <div className="form-group">
          <label className="form-label">Actividad *</label>
          <select
            className="form-control"
            value={activityKey}
            onChange={e => {
              const key = e.target.value;
              const cfg = ACTIVITIES[key];
              setActivityKey(key);
              setActivityLabel(cfg.label);
              setActivityUnit(cfg.unit);
              setMultiplier(cfg.multiplier);
              setWeightBased(cfg.weightBased);
            }}
            required
          >
            {Object.entries(ACTIVITIES).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <small className="form-text text-muted">
            Registros en <strong>{activityUnit}</strong>.{' '}
            {weightBased
              ? 'Se normaliza por peso corporal.'
              : 'No se normaliza por peso.'}
          </small>
        </div>

        <NumberField
          label="Tu peso (kg)"
          value={userWeight}
          onChange={setUserWeight}
          required
          tooltip="Tu peso se usa para normalizar el esfuerzo relativo."
        />

        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Guardar cambios' : 'Crear reto'}
        </button>
      </form>
    </div>
  );
}
