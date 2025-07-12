import React, { useState, useEffect, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../contexts/AuthContext';
import { db }      from '../firebaseConfig';

import TextField     from '../components/form/TextField';
import TextAreaField from '../components/form/TextAreaField';
import NumberField   from '../components/form/NumberField';

import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ChallengeForm.css';
import '../components/form/FormField.css';

// Configuración de actividades con valorMáximo
const ACTIVITIES = {
  pushup:    { label: 'Flexiones',   unit: 'reps', multiplier: 1.0, weightBased: true,  valorMaximo: 60 },
  pullup:    { label: 'Dominadas',   unit: 'reps', multiplier: 1.0, weightBased: true,  valorMaximo: 20 },
  squat:     { label: 'Sentadillas', unit: 'reps', multiplier: 1.0, weightBased: true,  valorMaximo: 100 },
  run:       { label: 'Carrera',     unit: 'km',   multiplier: 1.0, weightBased: false, valorMaximo: 10 }
};

// Input de fecha personalizado
const DateInput = forwardRef(({ value, onClick, label, error }, ref) => (
  <div className="form-field">
    <label className="form-label">{label}</label>
    <input
      type="text"
      ref={ref}
      value={value}
      onClick={onClick}
      readOnly
      placeholder="Selecciona fecha"
      className={`form-control${error ? ' is-invalid' : ''}`}
    />
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
));

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
  const [activityKey, setActivityKey] = useState('pushup');
  const [loading, setLoading]         = useState(isEdit);
  const [errors, setErrors]           = useState({});

  // Metadatos de actividad seleccionada
  const { unit: activityUnit, weightBased, multiplier, valorMaximo } = ACTIVITIES[activityKey];

  // Carga datos existentes si es edición
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'challenges', id));
        if (!snap.exists()) throw new Error('Reto no encontrado');
        const data = snap.data();
        setTitle(data.title);
        setDescription(data.description || '');
        setStartDate(data.startDate.toDate());
        setEndDate(data.endDate.toDate());
        setActivityKey(data.activity.key);
        const pSnap = await getDoc(
          doc(db, 'challenges', id, 'participants', user.uid)
        );
        if (pSnap.exists()) setUserWeight(pSnap.data().weight.toString());
      } catch (e) {
        console.error(e);
        setErrors(err => ({ ...err, global: e.message }));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, user.uid]);

  const validate = () => {
    const errs = {};
    if (!title.trim())        errs.title = 'El título es obligatorio';
    if (!startDate)           errs.startDate = 'Fecha inicio obligatoria';
    if (!endDate)             errs.endDate   = 'Fecha fin obligatoria';
    if (startDate && endDate && endDate < startDate)
                              errs.endDate   = 'Debe ser ≥ fecha inicio';
    if (!userWeight.trim())   errs.userWeight = 'Ingresa tu peso';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Preparar payload del reto
      const activityPayload = {
        key:         activityKey,
        label:       ACTIVITIES[activityKey].label,
        unit:        activityUnit,
        multiplier,            // multiplicador para puntos
        weightBased,
        valorMaximo           // valor máximo para normalización
      };

      const payload = {
        title,
        description,
        startDate: Timestamp.fromDate(startDate),
        endDate:   Timestamp.fromDate(endDate),
        activity:  activityPayload,
        weightBased
      };

      let chRef;
      if (isEdit) {
        await updateDoc(doc(db, 'challenges', id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        chRef = { id };
      } else {
        chRef = await addDoc(collection(db, 'challenges'), {
          ...payload,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
      }

      // Registrar o actualizar participante
      const wt = Number(userWeight);
      await setDoc(
        doc(db, 'challenges', chRef.id, 'participants', user.uid),
        { uid: user.uid, name: user.displayName||'', weight: wt, joinedAt: serverTimestamp() }
      );

      // Inicializar refWeight al crear
      if (!isEdit) {
        await updateDoc(doc(db, 'challenges', chRef.id), { refWeight: wt });
      }

      navigate('/challenges', { replace: true });
    } catch (e) {
      console.error(e);
      setErrors(err => ({ ...err, global: 'No se pudo guardar el reto.' }));
    }
  };

  if (loading) return <p>Cargando datos…</p>;

  return (
    <div className="challenge-form-container">
      <h2>{isEdit ? 'Editar Reto' : 'Crear Nuevo Reto'}</h2>
      {errors.global && <div className="alert alert-danger">{errors.global}</div>}

      <form className="challenge-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Título"
          value={title}
          onChange={setTitle}
          error={errors.title}
          required
        />

        <TextAreaField
          label="Descripción"
          value={description}
          onChange={setDescription}
          rows={4}
        />

        <div className="date-group">
          <ReactDatePicker
            selected={startDate}
            onChange={setStartDate}
            dateFormat="dd/MM/yyyy"
            customInput={<DateInput label="Fecha inicio *" error={errors.startDate} />}
          />
          <ReactDatePicker
            selected={endDate}
            onChange={setEndDate}
            dateFormat="dd/MM/yyyy"
            customInput={<DateInput label="Fecha fin *" error={errors.endDate} />}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Actividad *</label>
          <select
            className="form-control"
            value={activityKey}
            onChange={e => setActivityKey(e.target.value)}
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
          label="Tu peso (kg) *"
          value={userWeight}
          onChange={setUserWeight}
          inputProps={{ inputMode: 'decimal', pattern: '[0-9]+([.,][0-9]{1,2})?' }}
          error={errors.userWeight}
          tooltip="Tu peso se usa para normalizar el esfuerzo relativo."
          required
        />

        <button type="submit" className="btn btn-primary mt-3">
          {isEdit ? 'Guardar cambios' : 'Crear reto'}
        </button>
      </form>
    </div>
  );
}
