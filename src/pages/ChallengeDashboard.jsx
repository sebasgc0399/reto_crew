import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
import Loader from '../components/Loader';
import './ChallengeDashboard.css';

export default function ChallengeDashboard() {
  const { id: chId } = useParams();
  const { user }     = useAuth();

  const [participants, setParticipants]     = useState([]);
  const [entries, setEntries]               = useState([]);
  const [loadingParts, setLoadingParts]     = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const participantsRef = useRef([]);
  const meRef           = useRef(null);

  // 1) Carga participants
  useEffect(() => {
    const partsRef   = collection(db, 'challenges', chId, 'participants');
    const partsQuery = query(partsRef, orderBy('totalPoints', 'desc'));

    const unsub = onSnapshot(partsQuery, async snap => {
      const parts = await Promise.all(
        snap.docs.map(async d => {
          let { name = '', totalPoints } = d.data();
          if (!name) {
            try {
              const u = await getDoc(doc(db, 'users', d.id));
              name = u.exists() ? u.data().name : '';
            } catch {}
          }
          return { uid: d.id, name: name || d.id, totalPoints };
        })
      );
      setParticipants(parts);
      participantsRef.current = parts;
      setLoadingParts(false);
    });

    return () => unsub();
  }, [chId]);

  // 1.b) Cuando ya carguen los participantes, haz scroll a tu fila
  useEffect(() => {
    if (!loadingParts && meRef.current) {
      setTimeout(() => {
        meRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 200);
    }
  }, [loadingParts]);

  // 2) Carga entries — espera a que participantsRef esté listo
  useEffect(() => {
    if (loadingParts) return;

    setLoadingEntries(true);
    const entRef   = collection(db, 'challenges', chId, 'entries');
    const entQuery = query(entRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(entQuery, async snap => {
      const list = await Promise.all(snap.docs.map(async d => {
        const data = d.data();
        // 2.1) Busca en el ref
        const p = participantsRef.current.find(x => x.uid === data.userId);
        let name = p?.name ?? '';
        // 2.2) Si falta, busca en /users
        if (!name) {
          try {
            const u = await getDoc(doc(db, 'users', data.userId));
            name = u.exists() ? u.data().name : data.userId;
          } catch {
            name = data.userId;
          }
        }
        return {
          id: d.id,
          name,
          activityKey: data.activityKey,
          value: data.value,
          unit: data.unit,
          points: data.points,
          createdAt: data.createdAt
        };
      }));
      setEntries(list);
      setLoadingEntries(false);
    });

    return () => unsub();
  }, [chId, loadingParts]);

  if (loadingParts)   return <Loader text="Cargando participantes…" />;
  if (loadingEntries) return <Loader text="Cargando entradas…" />;

  return (
    <div className="dashboard-container">
      <h2>Leaderboard</h2>
      <ol className="leaderboard">
        {participants.map(p => {
          const isMe = user?.uid === p.uid;
          return (
            <li
              key={p.uid}
              className={isMe ? 'highlight' : ''}
              ref={isMe ? meRef : null}
            >
              <strong>{p.name}</strong> — {p.totalPoints.toFixed(2)} pts
            </li>
          );
        })}
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
