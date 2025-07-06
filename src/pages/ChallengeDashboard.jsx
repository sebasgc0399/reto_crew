// src/pages/ChallengeDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useParams }                   from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db }                          from '../firebaseConfig';
import './ChallengeDashboard.css';

export default function ChallengeDashboard() {
  const { id: chId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [entries, setEntries]           = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1) Leaderboard: participantes ordenados por puntos
      const pSnap = await getDocs(
        query(
          collection(db, 'challenges', chId, 'participants'),
          orderBy('totalPoints', 'desc')
        )
      );

      // Para cada participante, busca su nombre en /users/{uid}
      const parts = await Promise.all(
        pSnap.docs.map(async d => {
          const pData = d.data();
          let name = d.id; // fallback al uid
          try {
            const uSnap = await getDoc(doc(db, 'users', d.id));
            if (uSnap.exists() && uSnap.data().name) {
              name = uSnap.data().name;
            }
          } catch (e) {
            console.error('Error fetching user name for', d.id, e);
          }
          return {
            uid:         d.id,
            name,
            totalPoints: pData.totalPoints
          };
        })
      );
      setParticipants(parts);

      // 2) Últimas entradas
      const eSnap = await getDocs(
        query(
          collection(db, 'challenges', chId, 'entries'),
          orderBy('createdAt', 'desc')
        )
      );

      // Mapea cada entrada, reutilizando el array de participantes para el nombre
      const ent = eSnap.docs.map(d => {
        const eData = d.data();
        const participant = parts.find(p => p.uid === eData.userId);
        return {
          id:          d.id,
          name:        participant?.name || eData.userId,
          activityKey: eData.activityKey,
          value:       eData.value,
          unit:        eData.unit,
          points:      eData.points,
          createdAt:   eData.createdAt
        };
      });
      setEntries(ent);

      setLoading(false);
    }

    fetchData();
  }, [chId]);

  if (loading) return <p>Cargando dashboard…</p>;

  return (
    <div className="dashboard-container">
      <h2>Leaderboard</h2>
      <ol className="leaderboard">
        {participants.map(p => (
          <li key={p.uid}>
            <strong>{p.name}</strong> — {p.totalPoints.toFixed(2)} pts
          </li>
        ))}
      </ol>

      <h3>Entradas Recientes</h3>
      <table className="entries-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Actividad</th>
            <th>Valor</th>
            <th>Puntos</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const date = e.createdAt?.toDate
              ? e.createdAt.toDate().toLocaleString()
              : '';
            return (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.activityKey}</td>
                <td>{e.value} {e.unit}</td>
                <td>{e.points.toFixed(2)}</td>
                <td>{date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
