// src/components/profile/Avatar.jsx
import React from 'react';
import './Avatar.css';

export default function Avatar({ photoURL, onClick }) {
  return (
    <div
      className="avatar"
      style={{ backgroundImage: `url(${photoURL})` }}
      onClick={onClick}
    />
  );
}