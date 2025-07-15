// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }        from '../contexts/AuthContext';
import { doc, getDoc }     from 'firebase/firestore';
import { db }              from '../firebaseConfig';
import { useNavigate, useParams }     from 'react-router-dom';
import { useFollow }       from '../hooks/useFollow';


import PageTitle           from '../components/PageTitle';
import Avatar              from '../components/profile/Avatar';
import ShareButton         from '../components/profile/ShareButton';
import FollowStats         from '../components/profile/FollowStats';
import LevelProgress       from '../components/profile/LevelProgress';
import StatsGrid           from '../components/profile/StatsGrid';
import './Profile.css';

const xpForLevel = lvl => lvl * lvl * 100;

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Ahora leemos un posible param `:uid` para ver perfiles ajenos
  const { uid: viewedUid } = useParams();
  const profileUid = viewedUid || user.uid;


  const {
    followers,
    following,
    isFollowing,
    follow,
    unfollow
  } = useFollow(user?.uid);

  const [createdAt, setCreatedAt]               = useState(null);
  const [xp, setXp]                             = useState(0);
  const [level, setLevel]                       = useState(1);
//   const [globalRank, setGlobalRank]             = useState(null);
//   const [completedChallenges, setCompletedChallenges] = useState(0);
//   const [bests, setBests]                       = useState({});
  const [globalRank]             = useState(null);
  const [completedChallenges] = useState(0);
  const [bests]                       = useState({});
  
  // saber si es mi propio perfil
  const isOwnProfile = profileUid === user.uid;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCreatedAt(data.createdAt?.toDate());
        setXp(data.xp || 0);
        setLevel(data.level || 1);
      }
      // TODO: fetch globalRank, completedChallenges, bests...
    })();
  }, [user]);

  return (
    <div className="profile-page">
      <PageTitle>Mi perfil</PageTitle>

      <header className="profile-header">
        <Avatar
          photoURL={user.photoURL}
          onClick={() => navigate('/profile/edit-photo')}
        />
        <div className="profile-info">
          <h2>{user.displayName}</h2>
          {createdAt && (
            <p className="member-since">
              Miembro desde {createdAt.toLocaleString('es-ES', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
        <ShareButton />
      </header>

      <FollowStats
        followers={followers}
        following={following}
        onViewFollowers={() =>
          navigate('/profile/conexiones?view=followers')
        }
        onViewFollowing={() =>
          navigate('/profile/conexiones?view=following')
        }
      />

       {!isOwnProfile && (
        <div className="follow-action">
          <button
            className={`btn btn-outline ${
              isFollowing ? 'unfollow' : 'follow'
            }`}
            onClick={isFollowing ? unfollow : follow}
          >
            {isFollowing ? 'Dejar de seguir' : 'Seguir'}
          </button>
        </div>
      )}

      <LevelProgress level={level} xp={xp} xpForLevel={xpForLevel} />

      <StatsGrid
        globalRank={globalRank}
        completedChallenges={completedChallenges}
        bests={bests}
        onOpenAchievements={() => navigate('/achievements')}
      />
    </div>
  );
}
