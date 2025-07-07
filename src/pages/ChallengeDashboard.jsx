import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Loader                        from '../components/Loader';
import './ChallengeDashboard.css';

export default function ChallengeDashboard() {
  const { id: chId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ref para mantener la lista más actualizada de participantes
  const participantsRef = useRef([]);

  // 1) Listener en tiempo real para participantes
  useEffect(() => {
    const partsRef = collection(db, 'challenges', chId, 'participants');
    const partsQuery = query(partsRef, orderBy('totalPoints', 'desc'));

    const unsub = onSnapshot(partsQuery, async (pSnap) => {
      const parts = await Promise.all(
        pSnap.docs.map(async (d) => {
          const pData = d.data();
          // **1ª opción: leer name del participante directamente**
          let name = pData.name || '';

          // 2ª opción: si no hay name, fallback a /users/{uid}
          if (!name) {
            try {
              const uSnap = await getDoc(doc(db, 'users', d.id));
              if (uSnap.exists() && uSnap.data().name) {
                name = uSnap.data().name;
              }
            } catch (e) {
              console.error('Error fetching user name for', d.id, e);
            }
          }
          // sigue fallback si sigue vacío
          if (!name) name = d.id;

          return {
            uid: d.id,
            name,
            totalPoints: pData.totalPoints
          };
        })
      );
      
      // Actualizar tanto el estado como la ref
      setParticipants(parts);
      participantsRef.current = parts;
      setLoading(false);
    });

    return () => unsub();
  }, [chId]);

  // 2) Listener en tiempo real para entradas
  useEffect(() => {
    const entriesRef = collection(db, 'challenges', chId, 'entries');
    const entriesQuery = query(entriesRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(entriesQuery, (eSnap) => {
      // Mapea cada entrada, reutilizando el array de participantes para el nombre
      const ent = eSnap.docs.map((d) => {
        const eData = d.data();
        // Usar la ref para obtener los participantes más actualizados
        const participant = participantsRef.current.find(p => p.uid === eData.userId);
        return {
          id: d.id,
          name: participant?.name || eData.userId,
          activityKey: eData.activityKey,
          value: eData.value,
          unit: eData.unit,
          points: eData.points,
          createdAt: eData.createdAt
        };
      });
      setEntries(ent);
    });

    return () => unsub();
  }, [chId]); // Solo depende de chId

  if (loading) return <Loader text="Cargando dashboard…" />;

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