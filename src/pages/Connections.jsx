// src/pages/Connections.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useSearchParams } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import './Connections.css';

export default function Connections() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'followers';

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDocs(collection(db, 'users', user.uid, 'followers'));
      setFollowers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDocs(collection(db, 'users', user.uid, 'following'));
      setFollowing(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    })();
  }, [user]);

  const list = view === 'followers' ? followers : following;
  const emptyMsg = view === 'followers'
    ? 'Aún no te sigue nadie.'
    : 'Aún no sigues a nadie.';

  return (
    <div className="connections-page">
      <PageTitle>Conexiones</PageTitle>

      <div className="connections-tabs">
        <button
          className={view === 'followers' ? 'active' : ''}
          onClick={() => setSearchParams({ view: 'followers' })}
        >
          <span className="count">{followers.length}</span>
          <span className="label">Seguidores</span>
        </button>
        <button
          className={view === 'following' ? 'active' : ''}
          onClick={() => setSearchParams({ view: 'following' })}
        >
          <span className="count">{following.length}</span>
          <span className="label">Siguiendo</span>
        </button>
      </div>

      {list.length > 0 ? (
        <ul className="connections-list">
          {list.map(u => (
            <li key={u.uid}>
              <div
                className="avatar-sm"
                style={{ backgroundImage: `url(${u.photoURL || ''})` }}
              />
              <span className="name">{u.name || u.displayName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">{emptyMsg}</p>
      )}
    </div>
  );
}
