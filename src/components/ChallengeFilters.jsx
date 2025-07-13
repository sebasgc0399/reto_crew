import React, { useState, useEffect } from 'react';
import TextField from './form/TextField';
import './ChallengeFilters.css';

export default function ChallengeFilters({ activities, onFilterChange }) {
  // Estado local de los tres filtros
  const [search, setSearch] = useState('');
  const [activityKey, setActivityKey] = useState('');
  const [privacy, setPrivacy] = useState('all');
  
  // Estado para controlar la expansión de filtros
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Calcular filtros activos (excluyendo búsqueda)
  const activeFiltersCount = [
    activityKey !== '',
    privacy !== 'all'
  ].filter(Boolean).length;

  // Cada vez que cambie alguno, notificamos al padre
  useEffect(() => {
    onFilterChange({
      search: search.trim().toLowerCase(),
      activityKey, 
      privacy
    });
  }, [search, activityKey, privacy, onFilterChange]);

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  return (
    <div className="challenge-filters mb-4">
      {/* Fila principal: Búsqueda + Botón de filtros */}
      <div className="challenge-filters__search-row">
        <div className="challenge-filters__search-group">
          <TextField
            label="Buscar"
            value={search}
            onChange={setSearch}
            placeholder="Título del reto..."
            maxLength={30}
            validateRegex={/^[\p{L}\p{N} ]*$/u}
          />
        </div>

        {/* Botón para expandir/contraer filtros */}
        <button
          type="button"
          className={`challenge-filters__filter-toggle ${filtersExpanded ? 'active' : ''}`}
          onClick={toggleFilters}
          aria-expanded={filtersExpanded}
          aria-controls="additional-filters"
        >
          <svg className="challenge-filters__filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M7 12h10M10 18h4"/>
          </svg>
          Filtros
          {activeFiltersCount > 0 && (
            <span className="challenge-filters__filter-count">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtros expandidos */}
      <div 
        id="additional-filters"
        className={`challenge-filters__expanded ${filtersExpanded ? 'show' : ''}`}
      >
        {/* Filtro por actividad */}
        <div className="form-group">
          <label htmlFor="filter-activity" className="form-label">Actividad</label>
          <select
            id="filter-activity"
            className="form-select"
            value={activityKey}
            onChange={e => setActivityKey(e.target.value)}
          >
            <option value="">Todas</option>
            {activities.map(a => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por visibilidad */}
        <div className="form-group">
          <label htmlFor="filter-privacy" className="form-label">Visibilidad</label>
          <select
            id="filter-privacy"
            className="form-select"
            value={privacy}
            onChange={e => setPrivacy(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="public">Públicos</option>
            <option value="private">Privados</option>
          </select>
        </div>
      </div>
    </div>
  );
}