// src/pages/Connections.jsx
import React, { useEffect, useState } from 'react'
import { useAuth }                     from '../contexts/AuthContext'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from 'firebase/firestore'
import { db }                          from '../firebaseConfig'
import {
  useSearchParams,
  useNavigate,
  useParams,
  Navigate
} from 'react-router-dom'
import PageTitle                       from '../components/PageTitle'
import Loader                          from '../components/Loader'
import './Connections.css'

export default function Connections() {
  const { user, loading: authLoading } = useAuth()
  const navigate                       = useNavigate()
  const [searchParams]                 = useSearchParams()
  const view                           = searchParams.get('view') || 'followers'
  const { name: slug }                 = useParams()   // coincide con :name de /profile/:name/conexiones

  // -------------------------
  // Estado de resolución UID
  // -------------------------
  const [targetUid, setTargetUid]     = useState(null)
  const [notFound, setNotFound]       = useState(false)

  // -------------------------
  // Listas cargadas
  // -------------------------
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [loadingLists, setLoadingLists]   = useState(true)

  // 1) Resolver el slug de la ruta a un UID
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/', { replace: true })
      return
    }

    const loadTargetUid = async () => {
      // si no hay slug o coincide con tu propio name → tu perfil
      if (!slug || slug === user.name) {
        setTargetUid(user.uid)
        return
      }
      // si es otro, buscamos en users where name==slug
      const q = query(
        collection(db, 'users'),
        where('name', '==', slug)
      )
      const snaps = await getDocs(q)
      if (snaps.empty) {
        setNotFound(true)
      } else {
        setTargetUid(snaps.docs[0].id)
      }
    }

    loadTargetUid()
  }, [authLoading, user, slug, navigate])

  // 2) Cargar followers/following del targetUid
  useEffect(() => {
    if (!targetUid) return
    setLoadingLists(true)

    const loadLists = async () => {
      try {
        // 2.a) sólo IDs
        const [fSnap, gSnap] = await Promise.all([
          getDocs(collection(db, 'users', targetUid, 'followers')),
          getDocs(collection(db, 'users', targetUid, 'following'))
        ])
        const followerUids = fSnap.docs.map(d => d.id)
        const followingUids = gSnap.docs.map(d => d.id)

        // 2.b) cargamos perfiles completos en un batch
        const uniqueUids = Array.from(new Set([...followerUids, ...followingUids]))
        const docs = await Promise.all(
          uniqueUids.map(uid => getDoc(doc(db, 'users', uid)))
        )
        const perfilMap = {}
        docs.forEach(snap => {
          if (snap.exists()) {
            const d = snap.data()
            perfilMap[snap.id] = {
              uid: snap.id,
              name: d.name,
              photoURL: d.photoURL
            }
          }
        })

        // 2.c) armamos las listas en orden original
        setFollowersList(followerUids.map(uid => perfilMap[uid]).filter(Boolean))
        setFollowingList(followingUids.map(uid => perfilMap[uid]).filter(Boolean))
      } catch (err) {
        console.error('Error cargando conexiones:', err)
      } finally {
        setLoadingLists(false)
      }
    }

    loadLists()
  }, [targetUid])

  // -------------------------
  // Early returns
  // -------------------------
  if (authLoading || loadingLists) return <Loader text="Cargando conexiones…" />
  if (!user)                          return <Navigate to="/" replace />
  if (notFound)                       return <Navigate to="/404" replace />

  // seleccionamos la lista a mostrar
  const list     = view === 'followers' ? followersList : followingList
  const emptyMsg = view === 'followers'
    ? 'Aún no te sigue nadie.'
    : 'Aún no sigue a nadie.'

  return (
    <div className="connections-page">
      <PageTitle>Conexiones</PageTitle>

      <div className="connections-tabs">
        <button
          className={view === 'followers' ? 'active' : ''}
          onClick={() => navigate(`?view=followers`, { replace: true })}
        >
          <span className="count">{followersList.length}</span>
          <span className="label">Seguidores</span>
        </button>
        <button
          className={view === 'following' ? 'active' : ''}
          onClick={() => navigate(`?view=following`, { replace: true })}
        >
          <span className="count">{followingList.length}</span>
          <span className="label">Siguiendo</span>
        </button>
      </div>

      {list.length > 0 ? (
        <ul className="connections-list">
          {list.map(u => (
            <li
              key={u.uid}
              className="connections-item"
              onClick={() => navigate(`/profile/${u.name}`)}
            >
              <div
                className="avatar-sm"
                style={{
                  backgroundImage: u.photoURL
                    ? `url(${u.photoURL})`
                    : `url(/default-avatar.png)`
                }}
              />
              <span className="name">{u.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">{emptyMsg}</p>
      )}
    </div>
  )
}
