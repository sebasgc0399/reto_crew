// src/components/profile/LevelProgress.jsx
import React, { useState, useEffect } from 'react';
import './LevelProgress.css';

export default function LevelProgress({ level, xp, xpForLevel, loading = false }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const minXp = xpForLevel(level);
  const maxXp = xpForLevel(level + 1);
  const targetPercent = Math.max(
    0,
    Math.min(100, ((xp - minXp) / (maxXp - minXp)) * 100)
  );
  const remainingXp = maxXp - xp;
  const isFull = targetPercent >= 100;

  // Animación de la barra de progreso
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setAnimatedPercent(targetPercent);
    }, 100);

    return () => clearTimeout(timer);
  }, [targetPercent]);

  // Formatear números grandes
  const formatXP = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <section className={`level-progress ${loading ? 'loading' : ''}`}>
      <h3>Nivel {level}</h3>
      <div className="progress-bar">
        <div
          className={`progress-fill ${isFull ? 'full' : ''}`}
          style={{ width: isVisible ? `${animatedPercent}%` : '0%' }}
          role="progressbar"
          aria-valuenow={targetPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Progreso del nivel: ${targetPercent.toFixed(1)}%`}
        />
      </div>
      <small>{formatXP(xp)} XP</small>
      {!loading && (
        <div className="xp-info">
          <span className="current-xp">
            {formatXP(xp)} / {formatXP(maxXp)}
          </span>
          <span className="next-level">
            {remainingXp > 0
              ? `${formatXP(remainingXp)} para nivel ${level + 1}`
              : '¡Nivel completo!'}
          </span>
        </div>
      )}
    </section>
  );
}

// Versión simple (igual a la original)
export function SimpleLevelProgress({ level, xp, xpForLevel }) {
  const minXp = xpForLevel(level);
  const maxXp = xpForLevel(level + 1);
  const percent = Math.max(
    0,
    Math.min(100, ((xp - minXp) / (maxXp - minXp)) * 100)
  );

  return (
    <section className="level-progress">
      <h3>Nivel {level}</h3>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      <small>{xp} XP</small>
    </section>
  );
}
