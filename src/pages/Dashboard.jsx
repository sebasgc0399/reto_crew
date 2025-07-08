// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  collection,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import Loader                        from '../components/Loader';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  // Todos los retos activos donde estoy inscrito:
  const [activeChallenges, setActiveChallenges] = useState([]);
  // id del reto actualmente seleccionado en el <select>
  const [selectedChId, setSelectedChId] = useState(null);

  // Métricas del reto seleccionado
  const [points, setPoints] = useState(0);
  const [position, setPosition] = useState(null);

  // Cargar retos activos del usuario
  useEffect(() => {
    if (authLoading || !user) return;
    
    async function loadActiveChallenges() {
      try {
        setLoading(true);
        const now = Timestamp.now().toDate();
        
        // 1) Buscamos todas las inscripciones del user
        const insQ = query(
          collectionGroup(db, 'participants'),
          where('uid', '==', user.uid)
        );
        const insSnap = await getDocs(insQ);

        const retos = [];
        
        // 2) Para cada inscripción, consultamos la metadata del reto padre
        for (let docPart of insSnap.docs) {
          const chId = docPart.ref.parent.parent.id;
          const chSnap = await getDoc(doc(db, 'challenges', chId));
          
          if (!chSnap.exists()) continue;
          
          const ch = chSnap.data();
          const start = ch.startDate?.toDate();
          const end = ch.endDate?.toDate();
          
          // Verificar si el reto está activo
          if (start && end && start <= now && now <= end) {
            retos.push({
              id: chId,
              title: ch.title,
              totalPoints: docPart.data().totalPoints || 0
            });
          }
        }

        setActiveChallenges(retos);
        
        // Selecciona el primero por defecto
        if (retos.length > 0) {
          setSelectedChId(retos[0].id);
        }
      } catch (e) {
        console.error('Error cargando retos activos:', e);
      } finally {
        setLoading(false);
      }
    }

    loadActiveChallenges();
  }, [user, authLoading]);

  // 3) Cada vez que cambie el reto seleccionado, recalc puntos y posición
  useEffect(() => {
    if (!selectedChId || !user) return;
    
    async function loadChallengeMetrics() {
      try {
        setLoading(true);
        
        // a) Obtener tu totalPoints
        const pSnap = await getDoc(
          doc(db, 'challenges', selectedChId, 'participants', user.uid)
        );
        const myPoints = pSnap.exists() ? (pSnap.data().totalPoints || 0) : 0;
        setPoints(myPoints);

        // b) Obtener todos los participantes ordenados para determinar posición
        const lbSnap = await getDocs(
          query(
            collection(db, 'challenges', selectedChId, 'participants'),
            orderBy('totalPoints', 'desc')
          )
        );
        
        const rank = lbSnap.docs.findIndex(d => d.id === user.uid);
        setPosition(rank >= 0 ? rank + 1 : null);
        
      } catch (e) {
        console.error('Error recalculando métricas:', e);
        setPoints(0);
        setPosition(null);
      } finally {
        setLoading(false);
      }
    }

    loadChallengeMetrics();
  }, [selectedChId, user]);

  // Función para navegar a crear nuevo reto
  const handleCreateChallenge = () => {
    window.location.assign('/challenges/new');
  };

  if (authLoading || loading) {
    return (
      <div className="dashboard-container">
        <Loader text="Cargando datos…" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">
        ¡Hola, {user?.displayName || 'Entrenador'}!
      </h2>

      {activeChallenges.length === 0 ? (
        <div className="no-challenges">
          <p>No estás inscrito en ningún reto activo.</p>
          <Link to="/challenges/new" className="btn btn-primary">
            Crear nuevo reto
          </Link>
        </div>
      ) : (
        <>
          <div className="dashboard-filter">
            <label htmlFor="sel-challenge">Reto activo:</label>
            <select
              id="sel-challenge"
              value={selectedChId || ''}
              onChange={e => setSelectedChId(e.target.value)}
            >
              {activeChallenges.map(ch => (
                <option key={ch.id} value={ch.id}>
                  {ch.title}
                </option>
              ))}
            </select>
          </div>

          <section className="dashboard-summary">
            <div className="card">
              <h3>Puntos Totales</h3>
              <p>{points.toFixed(2)}</p>
            </div>
            <div className="card">
              <h3>Retos Activos</h3>
              <p>{activeChallenges.length}</p>
            </div>
            <div className="card">
              <h3>Posición</h3>
              <p>{position != null ? `#${position}` : '—'}</p>
            </div>
          </section>

          <section className="dashboard-next-steps">
            <Link to="/challenges/new" className="btn btn-primary">
              Crear nuevo reto
            </Link>
          </section>
        </>
      )}
    </div>
  );
}