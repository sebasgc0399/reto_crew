// src/components/profile/StatsGrid.jsx
import React from 'react';
import StatCard from './StatCard';
import { ACTIVITIES } from '../../constants/activities';
import './StatsGrid.css';

export default function StatsGrid({ globalRank, completedChallenges, bests, onOpenAchievements }) {
  // Formatea números grandes
  const formatNumber = (num) => {
    if (num == null) return '—';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  };

  // Función para renderizar las mejores marcas usando labels y unidades
  const formatBests = (bests) => {
    if (!bests || Object.keys(bests).length === 0) {
      return <span className="empty-state">Sin marcas aún</span>;
    }

    const entries = Object.entries(bests);
    const displayItems = entries.slice(0, 3).map(([actKey, val]) => {
      const cfg = ACTIVITIES[actKey] || { label: actKey, unit: '' };
      return (
        <li key={actKey}>
          <strong>{cfg.label}:</strong> {val} {cfg.unit}
        </li>
      );
    });

    return (
      <ul>
        {displayItems}
        {entries.length > 3 && (
          <li className="more-indicator">
            +{entries.length - 3} más
          </li>
        )}
      </ul>
    );
  };

  return (
    <section
      className="stats-grid"
      aria-label="Estadísticas del perfil"
    >
      <StatCard title="Posición Global">
        <p>{formatNumber(globalRank)}</p>
      </StatCard>

      <StatCard title="Retos completados">
        <p>{formatNumber(completedChallenges)}</p>
      </StatCard>

      <StatCard title="Mejores marcas">
        {formatBests(bests)}
      </StatCard>

      <StatCard
        title="Insignias"
        onClick={onOpenAchievements}
        clickable
        aria-label="Ver insignias y logros"
      >
        <span className="icon-badge" role="img" aria-label="Insignia">🏅</span>
        <span className="card-action-text">Ver logros</span>
      </StatCard>
    </section>
  );
}
