// src/pages/ChallengeForm.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import { useParams, useNavigate }                from 'react-router-dom';
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
import Loader        from '../components/Loader';

import { ACTIVITIES } from '../constants/activities';

import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ChallengeForm.css';
import '../components/form/FormField.css';

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

  // campos del formulario
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState(null);
  const [endDate, setEndDate]         = useState(null);
  const [userWeight, setUserWeight]   = useState('');
  const [activityKey, setActivityKey] = useState('pushup');
  const [password, setPassword]       = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);

  // flags de carga y errores
  const [loading, setLoading]         = useState(isEdit);
  const [checkingWeight, setCheckingWeight] = useState(!isEdit);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [errors, setErrors]           = useState({});

  // metadata de la actividad seleccionada
  const { unit: activityUnit, weightBased, multiplier, valorMaximo } =
    ACTIVITIES[activityKey];

  // 1) Si estamos editando, carga reto + participante como antes
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
        setPassword(data.password || '');
        setMaxParticipants(data.maxParticipants ?? 50);

        // Carga el peso del creador desde participants/
        const pSnap = await getDoc(
          doc(db, 'challenges', id, 'participants', user.uid)
        );
        if (pSnap.exists()) {
          setUserWeight(pSnap.data().weight.toString());
        }
      } catch (e) {
        console.error(e);
        setErrors(err => ({ ...err, global: e.message }));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, user.uid]);

  // 2) Si estamos creando, comprueba peso en users/{uid}
  useEffect(() => {
    if (isEdit) return;
    (async () => {
      try {
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        const uData = uSnap.exists() ? uSnap.data() : {};
        if (uData.weight != null) {
          // Ya tenía peso: lo usamos y no mostramos el input
          setUserWeight(String(uData.weight));
          setShowWeightInput(false);
        } else {
          // No tenía peso: mostramos el input
          setShowWeightInput(true);
        }
      } catch (e) {
        console.error('Error al leer peso de usuario:', e);
        // Por si acaso mostramos igualmente el input
        setShowWeightInput(true);
      } finally {
        setCheckingWeight(false);
      }
    })();
  }, [isEdit, user.uid]);

  // Validación de formulario
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'El título es obligatorio';
    if (!startDate)    errs.startDate = 'Fecha inicio obligatoria';
    if (!endDate)      errs.endDate   = 'Fecha fin obligatoria';
    if (startDate && endDate && endDate < startDate)
      errs.endDate = 'La fecha fin debe ser ≥ fecha inicio';

    // sólo validamos peso si mostramos el campo
    if (showWeightInput && (!userWeight.trim() || isNaN(Number(userWeight)))) {
      errs.userWeight = 'Ingresa un peso válido';
    }

    if (maxParticipants < 1 || maxParticipants > 50) {
      errs.maxParticipants = 'El límite debe estar entre 1 y 50';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Envío de formulario
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // 3) Prepara el payload del reto
      const activityPayload = {
        key:        activityKey,
        label:      ACTIVITIES[activityKey].label,
        unit:       activityUnit,
        multiplier,
        weightBased,
        valorMaximo
      };
      const payload = {
        title,
        description,
        startDate:       Timestamp.fromDate(startDate),
        endDate:         Timestamp.fromDate(endDate),
        activity:        activityPayload,
        weightBased,
        password:        password || null,
        maxParticipants
      };

      // 4) Crea o actualiza el reto
      let chRef;
      if (isEdit) {
        await updateDoc(doc(db, 'challenges', id), { ...payload, updatedAt: serverTimestamp() });
        chRef = { id };
      } else {
        chRef = await addDoc(collection(db, 'challenges'), {
          ...payload,
          createdBy:  user.uid,
          createdAt:  serverTimestamp()
        });
      }

      // 5) Determina el peso a usar (nunca nulo aquí)
      const wt = Number(userWeight);

      // 6) Inscribe al creador en participants/
      await setDoc(
        doc(db, 'challenges', chRef.id, 'participants', user.uid),
        {
          uid:      user.uid,
          name:     user.displayName || '',
          weight:   wt,
          joinedAt: serverTimestamp()
        }
      );

      if (showWeightInput) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { weight: wt });
      }

      
      if (!isEdit) {
        await updateDoc(doc(db, 'challenges', chRef.id), { refWeight: wt });
      }

      navigate('/challenges', { replace: true });
    } catch (e) {
      console.error(e);
      setErrors(err => ({ ...err, global: 'No se pudo guardar el reto.' }));
    }
  };

  if (loading || checkingWeight) return <Loader text="Cargando datos…"/>;

  const titleText = isEdit ? 'Editar Reto' : 'Crear Nuevo Reto';

  return (
    <div className="challenge-form-container">
      <h2>{titleText}</h2>
      {errors.global && <div className="alert alert-danger">{errors.global}</div>}

      <form className="challenge-form" onSubmit={handleSubmit} noValidate>
        {/* Título */}
        <TextField
          label="Título "
          value={title}
          onChange={setTitle}
          error={errors.title}
          required
          maxLength={30}
          validateRegex={/^[\p{L}\p{N} ]*$/u}
        />

        {/* Descripción */}
        <TextAreaField
          label="Descripción"
          value={description}
          onChange={setDescription}
          rows={4}
          maxLength={200}
          validateRegex={/^[\p{L}\p{N} ]*$/u}
        />

        {/* Fechas */}
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

        {/* Selector de actividad */}
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

        {/* Peso del creador: sólo si no viene en users/{uid} */}
        {showWeightInput && (
          <NumberField
            label="Tu peso (kg) *"
            value={userWeight}
            onChange={val => {
              if (val === '') {
                setUserWeight('');
              } else {
                setUserWeight(Number(val));
              }
            }}
            inputProps={{inputMode: 'decimal',pattern: '[0-9]+([.,][0-9]{1,2})?',min: 1,max: 999,step: '0.1',placeholder: 'Ej: 70.5'}}
            required
            tooltip="Tu peso se usa para normalizar el esfuerzo relativo."
            error={errors.userWeight}
          />
        )}

        {/* Clave / privacidad */}
        <TextField
          label="Clave (opcional)"
          type="password"
          value={password}
          onChange={setPassword}
          tooltip="Si la defines, el reto será privado."
          inputProps={{ autoComplete: 'new-password' }}
          maxLength={15}
          validateRegex={/^[\p{L}\p{N} ]*$/u}
        />

        {/* Límite de participantes */}
        <NumberField
          label="Límite de participantes"
          value={maxParticipants}
          onChange={val => {
            if (val === '') {
              setMaxParticipants('');
            } else {
              setMaxParticipants(Number(val));
            }
          }}
          tooltip="Máx. 1–50 participantes."
          min={1}
          max={50}
        />

        <button type="submit" className="btn btn-primary mt-3">
          {isEdit ? 'Guardar cambios' : 'Crear reto'}
        </button>
      </form>
    </div>
  );
}
