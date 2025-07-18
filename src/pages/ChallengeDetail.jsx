import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Loader from '../components/Loader';
import PageTitle from '../components/PageTitle';
import ParticipantsList from '../components/ParticipantsList';
import Subtitle from '../components/Subtitle';
import ChallengeDates from '../components/ChallengeDates';

import './ChallengeDetail.css';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      // 1) Datos del reto
      const chSnap = await getDoc(doc(db, 'challenges', id));
      if (!chSnap.exists()) {
        console.warn('Reto no encontrado:', id);
        setLoading(false);
        return;
      }
      const data = chSnap.data();
      setChallenge({ id: chSnap.id, ...data });

      const myPartSnap = await getDoc(
        doc(db, 'challenges', id, 'participants', user.uid)
      );
      setIsParticipant(myPartSnap.exists());

      setLoading(false);
    }
    if (user) fetchDetail();
  }, [id, user]);

  if (loading) return <Loader text="Cargando detalle del reto…" />;
  if (!challenge) return <p>Reto no encontrado.</p>;

  const { title, description, startDate, endDate } = challenge;
  const start = new Date(startDate.seconds * 1000);
  const end = new Date(endDate.seconds * 1000);

  // Extiende un día de gracia tras endDate
  const graceEnd = new Date(end.getTime() + 48 * 60 * 60 * 1000);
  const now = new Date();
  const canRegister = isParticipant && now >= start && now <= graceEnd;

  // Formato legible
  const startText = start.toLocaleDateString();
  const endText = end.toLocaleDateString();

  return (
    <div className="challenge-detail">
      <PageTitle>{title}</PageTitle>
      <ChallengeDates startText={startText} endText={endText}/>

      {description && <Subtitle>{description}</Subtitle>}
    
      {isParticipant && (
        <ParticipantsList challengeId={id} />
      )}

      <div className="challenge-detail__actions">
        {!isParticipant ? (
          <Link to={`/challenges/${id}/join`}>
            <button className="btn btn-primary">Unirse al reto</button>
          </Link>
        ) : (
          canRegister && (
            <Link to={`/challenges/${id}/entry`}>
              <button className="btn btn-primary">Registrar</button>
            </Link>
          )
        )}

        <Link to={`/challenges/${id}/dashboard`}>
          <button className="btn btn-outline-secondary">Ver dashboard</button>
        </Link>
      </div>
    </div>
  );
}
