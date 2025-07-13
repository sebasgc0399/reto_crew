import React from 'react';
import './ChallengeDates.css';

export default function ChallengeDates({ 
  startText, 
  endText, 
  variant = 'default', 
  showIcon = true,
  className = '' 
}) {
  return (
    <div className={`challenge-dates ${variant} ${className}`}>
      {showIcon && (
        <span className="challenge-dates__icon" aria-hidden="true">
          📅
        </span>
      )}
      <span className="challenge-dates__text">
        <span className="challenge-dates__start">{startText}</span>
        <span className="challenge-dates__separator" aria-hidden="true">→</span>
        <span className="challenge-dates__end">{endText}</span>
      </span>
    </div>
  );
}