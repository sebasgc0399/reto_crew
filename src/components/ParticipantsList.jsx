import React, { useEffect, useState } from 'react';
import { collection, getDocs }        from 'firebase/firestore';
import { db }                         from '../firebaseConfig';
import Loader                        from './Loader';
import PageTitle                     from './PageTitle';
import './ParticipantsList.css';

export default function ParticipantsList({ challengeId }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function fetchParticipants() {
      setLoading(true);
      try {
        const partsSnap = await getDocs(
          collection(db, 'challenges', challengeId, 'participants')
        );
        const list = partsSnap.docs.map(docSnap => {
          const d = docSnap.data();
          return d.name || d.uid;
        });
        setParticipants(list);
      } catch (err) {
        console.error('Error al cargar participantes:', err);
      } finally {
        setLoading(false);
      }
    }
    if (challengeId) fetchParticipants();
  }, [challengeId]);

  if (loading) return <Loader text="Cargando participantes…" />;
  if (participants.length === 0) return (
    <div className="participants-list">
        <PageTitle level={3} variant="small">Participantes</PageTitle>
        <p className="empty-state">No hay participantes aún.</p>
    </div>
    );

  return (
    <div className="participants-list with-counter" data-count={participants.length}>
        <PageTitle level={4} variant="small">Participantes</PageTitle>
        <ul>
        {participants.map((name, i) => (
            <li key={i}>{name}</li>
        ))}
        </ul>
    </div>
    );
}
