// src/components/profile/LevelProgress.jsx
import React from 'react';
import './LevelProgress.css';

export default function LevelProgress({ level, xp, xpForLevel }) {
  const minXp = xpForLevel(level);
  const maxXp = xpForLevel(level + 1);
  const percent = Math.max(0, Math.min(100, ((xp - minXp) / (maxXp - minXp)) * 100));

  return (
    <section className="level-progress">
      <h3>Nivel {level}</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <small>{xp} XP</small>
    </section>
  );
}