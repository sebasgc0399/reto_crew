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
import { useNavigate, useParams, Navigate } from 'react-router-dom'
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
  const { name: slug }                 = useParams()
  const navigate                       = useNavigate()

  const [profileUser, setProfileUser] = useState(null)
  const [notFound, setNotFound]       = useState(false)
  const [stats, setStats]             = useState({
    createdAt: null,
    xp: 0,
    level: 1,
    globalRank: null,
    completedChallenges: 0,
    bests: {}
  })

  // Seguidores/Seguidos en tiempo real
  const targetUid = profileUser?.uid || user?.uid
  const {
    followers,
    following,
    isFollowing,
    follow,
    unfollow
  } = useFollow(targetUid)

  // Cargar perfil y stats (incluye cálculo de globalRank)
  useEffect(() => {
    if (authLoading || !user) return

    ;(async () => {
      let uid

      // 1) Determinar UID (propio o ajeno)
      if (!slug || slug === user.name) {
        uid = user.uid
      } else {
        const q      = query(collection(db, 'users'), where('name', '==', slug))
        const snaps  = await getDocs(q)
        if (snaps.empty) {
          setNotFound(true)
          return
        }
        uid = snaps.docs[0].id
      }

      // 2) Leer tu documento
      const userSnap = await getDoc(doc(db, 'users', uid))
      if (!userSnap.exists()) {
        setNotFound(true)
        return
      }
      const data = userSnap.data()

      // 3) Leer todos los usuarios para rank
      const allSnap = await getDocs(collection(db, 'users'))
      const users   = allSnap.docs.map(d => ({
        uid: d.id,
        xp:  d.data().xp || 0
      }))
      // orden descendente por xp
      users.sort((a, b) => b.xp - a.xp)
      // posición (1‑based)
      const rank = users.findIndex(u => u.uid === uid)
      const globalRank = rank >= 0 ? rank + 1 : null

      // 4) Actualizar estado, incluyendo `bests`
      setProfileUser({
        uid,
        name: data.name,
        photoURL: data.photoURL
      })
      setStats({
        createdAt:           data.createdAt?.toDate() || null,
        xp:                  data.xp || 0,
        level:               data.level || 1,
        globalRank,
        completedChallenges: data.completedChallenges || 0,
        bests:               data.bests || {}   // <— recogemos las mejores marcas
      })
    })()
  }, [authLoading, user, slug, navigate])

  // Early returns
  if (authLoading)  return <Loader text="Cargando perfil…" />
  if (!user)        return <Navigate to="/" replace />
  if (notFound)     return <Navigate to="/404" replace />
  if (!profileUser) return <Loader text="Cargando perfil…" />

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
          onClick={() => isOwnProfile && navigate('/profile/edit-photo')}
        />
        <div className="profile-info">
          <h2>{name}</h2>
          {stats.createdAt && (
            <p className="member-since">
              Miembro desde{' '}
              {stats.createdAt.toLocaleString('es-ES', {
                month: 'long', year: 'numeric'
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
