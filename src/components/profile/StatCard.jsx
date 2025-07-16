// src/components/profile/StatCard.jsx
import React from 'react';
import './StatCard.css';

export default function StatCard({ title, children, onClick, clickable, ...props }) {
  const cardProps = {
    className: `card${clickable ? ' clickable' : ''}`,
    ...(clickable && {
      onClick,
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      },
      tabIndex: 0,
      role: 'button',
      'aria-pressed': false,
    }),
    ...props
  };

  return (
    <div {...cardProps}>
      <h4>{title}</h4>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}