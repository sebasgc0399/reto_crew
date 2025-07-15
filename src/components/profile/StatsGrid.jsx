// src/components/profile/StatsGrid.jsx
import React from 'react';
import StatCard from './StatCard';
import './StatsGrid.css';

export default function StatsGrid({ globalRank, completedChallenges, bests, onOpenAchievements }) {
  return (
    <section className="stats-grid">
      <StatCard title="Posición Global">
        <p>{globalRank ?? '—'}</p>
      </StatCard>
      <StatCard title="Retos completados">
        <p>{completedChallenges}</p>
      </StatCard>
      <StatCard title="Mejores marcas">
        <ul>
          {Object.entries(bests).map(([act, val]) => (
            <li key={act}>{act}: {val}</li>
          ))}
        </ul>
      </StatCard>
      <StatCard title="Insignias" onClick={onOpenAchievements} clickable>
        <span className="icon-badge">🏅</span>
      </StatCard>
    </section>
  );
}