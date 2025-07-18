// src/pages/Achievements.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }                   from '../contexts/AuthContext';
import { useNavigate, useParams }    from 'react-router-dom';
import PageTitle                     from '../components/PageTitle';
import Loader                        from '../components/Loader';
import { BADGES }                    from '../constants/badges';
import { db }                        from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './Achievements.css';

export default function Achievements() {
  const { user, loading: authLoading } = useAuth();
  const navigate                       = useNavigate();
  const { name: slug }                 = useParams();

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    (async () => {
      try {
        let uid;
        if (slug === user.displayName) {
          uid = user.uid;
        } else {
          const q = query(
            collection(db, 'users'),
            where('name', '==', slug)
          );
          const snaps = await getDocs(q);
          if (snaps.empty) {
            setNotFound(true);
            setLoading(false);
            return;
          }
          uid = snaps.docs[0].id;
        }

        // leemos los badges desde Firestore
        const snap = await getDocs(
          collection(db, 'users', uid, 'badges')
        );
        const unlockedSet = new Set(snap.docs.map(d => d.id));
        console.log('unlockedSet:', unlockedSet);

        // mergeamos comprobando la propiedad correcta (aquí usamos `id`)
        const merged = BADGES.map(b => ({
          ...b,
          unlocked: unlockedSet.has(b.id)
        }));

        setAchievements(merged);
      } catch (err) {
        console.error('Error cargando insignias:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, slug, navigate]);

  if (authLoading || loading)  return <Loader text="Cargando insignias…" />;
  if (notFound)                 return <p className="error">Usuario no encontrado.</p>;

  return (
    <div className="achievements-page">
      <PageTitle>Insignias</PageTitle>
      {achievements.length === 0 ? (
        <p className="empty-state">No hay insignias disponibles.</p>
      ) : (
        <div className="achievements-grid">
          {achievements.map(badge => (
            <div
              key={badge.id}
              className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="badge-icon">{badge.icon}</div>
              <h4 className="badge-title">{badge.title}</h4>
              {badge.description && <p className="badge-desc">{badge.description}</p>}
              {!badge.unlocked && <div className="badge-overlay">🔒</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
