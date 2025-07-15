import React from 'react';
import './FollowStat.css';

export default function FollowStat({ count, label, onClick }) {
  return (
    <button className="follow-stat" onClick={onClick}>
      <strong>{count}</strong>
      <span>{label}</span>
    </button>
  );
}