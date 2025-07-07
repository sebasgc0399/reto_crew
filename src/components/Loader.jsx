import React from 'react';
import './Loader.css';

export default function Loader({ text = 'Cargando…' }) {
  return (
    <div className="loader-container">
      <div className="loader" />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
