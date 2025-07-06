// src/pages/ChallengeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link }            from 'react-router-dom';
import { useAuth }                    from '../contexts/AuthContext';
import {
  doc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { db }                         from '../firebaseConfig';
import './ChallengeDetail.css';

export default function ChallengeDetail() {
  const { id }        = useParams();
  const { user }      = useAuth();

  const [challenge, setChallenge]         = useState(null);
  const [participantsCount, setCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      // 1) Datos del reto
      const chSnap = await getDoc(doc(db, 'challenges', id));
      if (!chSnap.exists()) {
        console.warn('Reto no encontrado:', id);
        setLoading(false);
        return;
      }
      setChallenge({ id: chSnap.id, ...chSnap.data() });

      // 2) Conteo de participantes
      const partsSnap = await getDocs(
        collection(db, 'challenges', id, 'participants')
      );
      setCount(partsSnap.size);

      // 3) ¿Está el usuario inscrito?
      const myPartSnap = await getDoc(
        doc(db, 'challenges', id, 'participants', user.uid)
      );
      setIsParticipant(myPartSnap.exists());

      setLoading(false);
    }
    fetchDetail();
  }, [id, user.uid]);

  if (loading) return <p>Cargando detalle del reto…</p>;
  if (!challenge) return <p>Reto no encontrado.</p>;

  const { title, description, startDate, endDate } = challenge;
  const start = new Date(startDate.seconds * 1000).toLocaleDateString();
  const end   = new Date(endDate.seconds * 1000).toLocaleDateString();

  return (
    <div className="challenge-detail">
      <h2 className="challenge-detail__title">{title}</h2>
      <p className="challenge-detail__dates">
        {start} → {end}
      </p>
      {description && (
        <p className="challenge-detail__desc">{description}</p>
      )}
      <p className="challenge-detail__participants">
        Participantes: {participantsCount}
      </p>

      <div className="challenge-detail__actions">
        {!isParticipant ? (
          <Link to={`/challenges/${id}/join`}>
            <button className="btn btn-primary">Unirse al reto</button>
          </Link>
        ) : (
          <Link to={`/challenges/${id}/entry`}>
            <button className="btn btn-primary">Registrar flexión</button>
          </Link>
        )}
        <Link to={`/challenges/${id}/dashboard`}>
          <button className="btn btn-outline-secondary">
            Ver dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
