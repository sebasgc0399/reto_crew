// src/pages/ChallengesList.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link }                       from 'react-router-dom';
import { collection, getDocs }        from 'firebase/firestore';
import { db }                         from '../firebaseConfig';
import ChallengeCard                  from '../components/ChallengeCard';
import Loader                         from '../components/Loader';
import ChallengeFilters               from '../components/ChallengeFilters';
import Pagination                     from '../components/Pagination';
import { ACTIVITIES }                 from '../constants/activities';

import './ChallengesList.css';

export default function ChallengesList() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Filtros y paginación
  const [filters, setFilters] = useState({
    search:      '',
    activityKey: '',
    privacy:     'all'
  });
  const [page, setPage] = useState(1);

  // 1) Estabilizamos el handler para evitar bucles infinitos
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // 2) Carga los retos al montar
  useEffect(() => {
    async function fetchChallenges() {
      const snap = await getDocs(collection(db, 'challenges'));
      const data = await Promise.all(
        snap.docs.map(async docSnap => {
          const d = docSnap.data();
          const partsSnap = await getDocs(
            collection(db, 'challenges', docSnap.id, 'participants')
          );
          return {
            id:                docSnap.id,
            title:             d.title,
            startDate:         d.startDate,
            endDate:           d.endDate,
            participantsCount: partsSnap.size,
            createdBy:         d.createdBy,
            password:          d.password || null,
            maxParticipants:   d.maxParticipants ?? 50,
            activity:          d.activity
          };
        })
      );
      setChallenges(data);
      setLoading(false);
    }
    fetchChallenges();
  }, []);

  // 3) Filtrar + límite top 100
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

  // 5) Generar lista única y estable de actividades
  const activityOptions = useMemo(
    () => Object.values(ACTIVITIES).map(a => ({ key: a.key, label: a.label })),
    []
  );

  // 6) Callbacks de ChallengeCard
  const handleDeleted = removedId => {
    setChallenges(curr => curr.filter(c => c.id !== removedId));
  };
  const handleUpdated = updated => {
    setChallenges(curr =>
      curr.map(c => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  };

  if (loading) return <Loader text="Cargando retos…" />;

  return (
    <div className="challenges-list-container">
      <div className="challenges-list-header">
        <h2>Retos Activos</h2>
        <Link to="/challenges/new" className="btn btn-primary">
          Crear nuevo reto
        </Link>
      </div>

      {/* Filtros */}
      <ChallengeFilters
        activities={activityOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Resultados */}
      {filtered.length === 0 ? (
        <p>No se encontraron retos con estos filtros.</p>
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

          {/* Paginación */}
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showPageNumbers={true}
            className="compact" // Usar el modo compacto
          />
        </>
      )}
    </div>
  );
}
