import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }    from 'react-router-dom';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db }                        from '../firebaseConfig';
import { useAuth }                   from '../contexts/AuthContext';
import ReactDatePicker                from 'react-datepicker';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './ChallengeForm.css';

export default function ChallengeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [refWeight, setRefWeight]     = useState('');
  const [loading, setLoading]         = useState(isEdit);
  const [error, setError]             = useState('');

  // Si estamos editando, carga los datos existentes
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const docRef  = doc(db, 'challenges', id);
        const snap    = await getDoc(docRef);
        if (!snap.exists()) {
          setError('Reto no encontrado.');
          setLoading(false);
          return;
        }
        const data = snap.data();
        setTitle(data.title);
        setDescription(data.description || '');
        // Convertir Firestore Timestamp a yyyy-MM-dd
        setStartDate(new Date(data.startDate.seconds * 1000)
          .toISOString().substr(0,10));
        setEndDate(new Date(data.endDate.seconds * 1000)
          .toISOString().substr(0,10));
        setRefWeight(data.refWeight);
      } catch (e) {
        console.error(e);
        setError('Error cargando datos del reto.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!title || !startDate || !endDate || !refWeight) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    try {
      const payload = {
        title,
        description,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate:   Timestamp.fromDate(new Date(endDate)),
        refWeight: Number(refWeight),
      };

      if (isEdit) {
        // Editar
        const docRef = doc(db, 'challenges', id);
        await updateDoc(docRef, {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        // Crear
        await addDoc(collection(db, 'challenges'), {
          ...payload,
          createdBy:  user.uid,
          createdAt: serverTimestamp()
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
        <label>
          Título *
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          Descripción
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        <div className="date-group">
          <label>
            Fecha inicio *
            <ReactDatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/MM/yyyy"
              className="react-datepicker__input"
              required
            />
          </label>
          <label>
            Fecha fin *
            <ReactDatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/MM/yyyy"
              className="react-datepicker__input"
              required
            />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Peso de referencia (kg) *
            <Tippy
              content={
                <>
                  <strong>Peso de referencia:</strong><br/>
                  Valor base (ej. 73.5 kg) para normalizar esfuerzo:<br/>
                  <em>puntos = reps × multiplier × (peso / PesodeReferencia)</em>
                </>
              }
              placement="right"
              delay={[200, 0]}
              arrow={true}
              // <- Esto hace que el tooltip se añada al <body>, no al contenedor
              appendTo={() => document.body}
              interactive={true}                     // permite hover sobre el propio tooltip
              popperOptions={{ strategy: 'fixed' }}  // evita recortes inesperados
            >
              <span className="info-icon">ℹ️</span>
            </Tippy>
          </label>
          <input
            type="number"
            value={refWeight}
            onChange={e => setRefWeight(e.target.value)}
            step="0.1"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Guardar cambios' : 'Crear reto'}
        </button>
      </form>
    </div>
  );
}
