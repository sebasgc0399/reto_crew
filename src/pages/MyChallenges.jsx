import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth }                              from '../contexts/AuthContext';
import {doc, collectionGroup, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db }                                   from '../firebaseConfig';
import ChallengeCard                            from '../components/ChallengeCard';
import Loader                                   from '../components/Loader';
import ChallengeFilters                         from '../components/ChallengeFilters';
import Pagination                               from '../components/Pagination';
import PageTitle                                from '../components/PageTitle';
import { ACTIVITIES }                           from '../constants/activities';

import './ChallengesList.css'; // Reutiliza tus estilos existentes

export default function MyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Filtros y paginación
  const [filters, setFilters] = useState({
    search:      '',
    activityKey: '',
    privacy:     'all'
  });
  const [page, setPage] = useState(1);

  // 1) Handler estable para filtros
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // 2) Carga solo tus retos
  useEffect(() => {
    if (!user) return;
    (async () => {
      // 2.1) Encuentra todos los docs "participants" donde uid === user.uid
      const partsQuery = query(
        collectionGroup(db, 'participants'),
        where('uid', '==', user.uid)
      );
      const partsSnap = await getDocs(partsQuery);
      // 2.2) Para cada uno, obten el reto padre
      const data = await Promise.all(
        partsSnap.docs.map(async partDoc => {
          const chId = partDoc.ref.parent.parent.id;
          const chSnap = await getDoc(doc(db, 'challenges', chId));
          const partsCount = chSnap.size;
          const chData = chSnap.exists() ? chSnap.data() : {}; 
          return {
            id:                chId,
            title:             chData.title,
            startDate:         chData.startDate,
            endDate:           chData.endDate,
            participantsCount: partsCount,
            password:          chData.password || null,
            maxParticipants:   chData.maxParticipants ?? 50,
            createdBy:         chData.createdBy,
            activity:          chData.activity
          };
        })
      );
      setChallenges(data);
      setLoading(false);
    })();
  }, [user]);

  // 3) Filtrar + límite top 50
  const filtered = challenges
    .filter(c =>
      c.title.toLowerCase().includes(filters.search) &&
      (!filters.activityKey || c.activity.key === filters.activityKey) &&
      (filters.privacy === 'all' ||
        (filters.privacy === 'public'  && !c.password) ||
        (filters.privacy === 'private' && !!c.password))
    )
    .slice(0, 50);

  // 4) Paginación
  const ITEMS_PER_PAGE = 5;
  const totalPages     = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems      = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // 5) Opciones de actividad
  const activityOptions = useMemo(
    () => Object.values(ACTIVITIES).map(a => ({ key: a.key, label: a.label })),
    []
  );

  // 6) Callbacks de ChallengeCard (si permites eliminar/editar)
  const handleDeleted = removedId => {
    setChallenges(curr => curr.filter(c => c.id !== removedId));
  };
  const handleUpdated = updated => {
    setChallenges(curr =>
      curr.map(c => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  };

  if (loading) return <Loader text="Cargando tus retos…" />;

  return (
    <div className="challenges-list-container">
      <PageTitle>Mis Retos</PageTitle>

      {/* Filtros */}
      <ChallengeFilters
        activities={activityOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Resultados */}
      {filtered.length === 0 ? (
        <p>No estás inscrito en ningún reto.</p>
      ) : (
        <>
          <div className="challenges-grid">
            {pageItems.map(ch => (
              <ChallengeCard
                key={ch.id}
                challenge={ch}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            ))}
          </div>

          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showPageNumbers={true}
            className="compact"
          />
        </>
      )}
    </div>
  );
}
