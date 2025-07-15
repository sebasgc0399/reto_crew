// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import {
  useNavigate,
  useParams,
  Navigate
} from 'react-router-dom'
import { useFollow } from '../hooks/useFollow'

import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import Avatar from '../components/profile/Avatar'
import ShareButton from '../components/profile/ShareButton'
import FollowStats from '../components/profile/FollowStats'
import FollowButton from '../components/profile/FollowButton'
import LevelProgress from '../components/profile/LevelProgress'
import StatsGrid from '../components/profile/StatsGrid'
import './Profile.css'

const xpForLevel = lvl => lvl * lvl * 100

export default function Profile() {
  const { user, loading: authLoading } = useAuth()
  const { name: slug } = useParams()        // /profile/:name
  const navigate = useNavigate()

  // Estado de perfil
  const [profileUser, setProfileUser] = useState(null)
  const [notFound, setNotFound]       = useState(false)

  // Estadísticas
  const [stats, setStats] = useState({
    createdAt: null,
    xp: 0,
    level: 1,
    followersCount: 0,
    followingCount: 0,
    globalRank: null,
    completedChallenges: 0,
    bests: {}
  })

  // Hook de seguimiento en tiempo real
  const targetUid = profileUser?.uid || user?.uid
  const {
    followers,
    following,
    isFollowing,
    follow,
    unfollow
  } = useFollow(targetUid)

  // Carga datos al montar o cuando cambie el slug
  useEffect(() => {
    if (authLoading || !user) return

    ;(async () => {
      let uid, name, photoURL, docData

      const isOwn = !slug || slug === user.name
      if (isOwn) {
        uid = user.uid
        name = user.name
        photoURL = user.photoURL
      } else {
        const q = query(
          collection(db, 'users'),
          where('name', '==', slug)
        )
        const snaps = await getDocs(q)
        if (snaps.empty) {
          setNotFound(true)
          return
        }
        const dSnap = snaps.docs[0]
        const d = dSnap.data()
        uid = dSnap.id
        name = d.name
        photoURL = d.photoURL
        docData = d
      }

      setProfileUser({ uid, name, photoURL })

      if (!docData) {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists()) docData = snap.data()
      }

      if (docData) {
        setStats({
          createdAt: docData.createdAt?.toDate() || null,
          xp: docData.xp || 0,
          level: docData.level || 1,
          followersCount: docData.followersCount || 0,
          followingCount: docData.followingCount || 0,
          globalRank: docData.globalRank || null,
          completedChallenges: docData.completedChallenges || 0,
          bests: docData.bests || {}
        })
      }
    })()
  }, [authLoading, user, slug])

  // Early‑returns (después de los hooks)
  if (authLoading)                           return <Loader text="Cargando perfil…" />
  if (!user)                                 return <Navigate to="/" replace />
  if (notFound)                              return <Navigate to="/404" replace />
  if (!profileUser)                          return <Loader text="Cargando perfil…" />

  const { uid, name, photoURL } = profileUser
  const isOwnProfile = uid === user.uid

  return (
    <div className="profile-page">
      <PageTitle>
        {isOwnProfile ? 'Mi perfil' : `Perfil de ${name}`}
      </PageTitle>

      <header className="profile-header">
        <Avatar
          photoURL={photoURL}
          onClick={() =>
            isOwnProfile && navigate('/profile/edit-photo')
          }
        />

        <div className="profile-info">
          <h2>{name}</h2>
          {stats.createdAt && (
            <p className="member-since">
              Miembro desde{' '}
              {stats.createdAt.toLocaleString('es-ES', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          )}
        </div>

        <div className="profile-actions">
          <ShareButton url={`${window.location.origin}/profile/${name}`} />
          {!isOwnProfile && (
            <FollowButton
              targetUid={uid}
              isFollowing={isFollowing}
              onFollow={follow}
              onUnfollow={unfollow}
            />
          )}
        </div>
      </header>

      <FollowStats
        followers={followers}
        following={following}
        onViewFollowers={() =>
          navigate(`/profile/${name}/conexiones?view=followers`)
        }
        onViewFollowing={() =>
          navigate(`/profile/${name}/conexiones?view=following`)
        }
      />

      <LevelProgress
        level={stats.level}
        xp={stats.xp}
        xpForLevel={xpForLevel}
      />

      <StatsGrid
        globalRank={stats.globalRank}
        completedChallenges={stats.completedChallenges}
        bests={stats.bests}
        onOpenAchievements={() =>
          navigate(`/profile/${name}/achievements`)
        }
      />
    </div>
  )
}
