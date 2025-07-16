// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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
  const { name: slug }                 = useParams()       // /profile/:name
  const navigate                       = useNavigate()

  // 1) Estado
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

  // 2) Hook de seguidores/seguidos
  const targetUid = profileUser?.uid || user?.uid
  const {
    followers,
    following,
    isFollowing,
    follow,
    unfollow
  } = useFollow(targetUid)

  // 3) Cargar Firestore (propio o ajeno)
  useEffect(() => {
    if (authLoading || !user) return

    ;(async () => {
      let uid

      // ¿propio o ajeno?
      if (!slug || slug === user.name) {
        uid = user.uid
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
        uid = snaps.docs[0].id
      }

      const snap = await getDoc(doc(db, 'users', uid))
      if (!snap.exists()) {
        setNotFound(true)
        return
      }
      const data = snap.data()

      setProfileUser({
        uid,
        name: data.name,
        photoURL: data.photoURL
      })
      setStats({
        createdAt: data.createdAt?.toDate() || null,
        xp: data.xp || 0,
        level: data.level || 1,
        globalRank: data.globalRank || null,
        completedChallenges: data.completedChallenges || 0,
        bests: data.bests || {}
      })
    })()
  }, [authLoading, user, slug, navigate])

  // 4) Early‑returns tras haber llamado TODOS los hooks
  if (authLoading)      return <Loader text="Cargando perfil…" />
  if (!user)            return <Navigate to="/" replace />
  if (notFound)         return <Navigate to="/404" replace />
  if (!profileUser)     return <Loader text="Cargando perfil…" />

  // 5) Render
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
        onOpenAchievements={() => navigate(`/profile/${name}/achievements`)}
      />
    </div>
  )
}
