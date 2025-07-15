// src/components/profile/FollowStats.jsx
import React from 'react';
import FollowStat from './FollowStat';
import './FollowStats.css';

export default function FollowStats({ followers, following, onViewFollowers, onViewFollowing }) {
  return (
    <div className="follow-stats">
      <FollowStat count={followers} label="Seguidores" onClick={onViewFollowers} />
      <FollowStat count={following} label="Siguiendo" onClick={onViewFollowing} />
    </div>
  );
}