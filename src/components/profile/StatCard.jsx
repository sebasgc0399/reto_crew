// src/components/profile/StatCard.jsx
import React from 'react';
import './StatCard.css';

export default function StatCard({ title, children, onClick, clickable }) {
  return (
    <div
      className={`card${clickable ? ' clickable' : ''}`}
      onClick={onClick}
    >
      <h4>{title}</h4>
      {children}
    </div>
  );
}