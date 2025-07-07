import React, { useEffect, useState } from 'react';
import { Link }                       from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db }                         from '../firebaseConfig';
import ChallengeCard                  from '../components/ChallengeCard';
import Loader                        from '../components/Loader';
import './ChallengesList.css';

export default function ChallengesList() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Carga los retos y su creador + cuenta de participantes
  useEffect(() => {
    async function fetchChallenges() {
      const snap = await getDocs(collection(db, 'challenges'));

      const data = await Promise.all(
        snap.docs.map(async docSnap => {
          const d = docSnap.data();

          // Contar participantes
          const partsSnap = await getDocs(
            collection(db, 'challenges', docSnap.id, 'participants')
          );

          return {
            id: docSnap.id,
            title: d.title,
            startDate: d.startDate,
            endDate: d.endDate,
            participantsCount: partsSnap.size,
            createdBy: d.createdBy   // capturamos quién lo creó
          };
        })
      );

      setChallenges(data);
      setLoading(false);
    }
    fetchChallenges();
  }, []);

  // Cuando un reto se elimina, actualizar el estado
  const handleDeleted = removedId => {
    setChallenges(curr => curr.filter(c => c.id !== removedId));
  };

  if (loading) return <Loader text="Cargando retos…" />;

  return (
    <div className="challenges-list-container">
      <div className="challenges-list-header">
        <h2>Retos Activos</h2>
        <Link to="/challenges/new" className="btn btn-primary">
          Crear nuevo reto
        </Link>
      </div>

      {challenges.length === 0 ? (
        <p>No hay retos aún. ¡Crea el primero!</p>
      ) : (
        <div className="challenges-grid">
          {challenges.map(ch => (
            <ChallengeCard
              key={ch.id}
              challenge={ch}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
