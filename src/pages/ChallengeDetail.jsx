// src/pages/ChallengeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ChallengeDetail.css';

export default function ChallengeDetail() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      // 1) Traer datos del reto
      const challengeSnap = await getDoc(doc(db, 'challenges', id));
      if (!challengeSnap.exists()) {
        console.warn('Reto no encontrado:', id);
        setLoading(false);
        return;
      }
      setChallenge({ id: challengeSnap.id, ...challengeSnap.data() });

      // 2) Contar participantes
      const partsSnap = await getDocs(
        collection(db, 'challenges', id, 'participants')
      );
      setParticipantsCount(partsSnap.size);

      setLoading(false);
    }
    fetchDetail();
  }, [id]);

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
        <Link to={`/challenges/${id}/entry`}>
          <button className="btn btn-primary">Registrar flexión</button>
        </Link>
        <Link to={`/challenges/${id}/dashboard`}>
          <button className="btn btn-outline-secondary">Ver dashboard</button>
        </Link>
      </div>
    </div>
  );
}
