// src/components/profile/FollowButton.jsx
import React from 'react';
import { useFollow } from '../../hooks/useFollow';
import './FollowButton.css';

export default function FollowButton({ targetUid }) {
  const { isFollowing, follow, unfollow } = useFollow(targetUid);

  return (
    <button
      className={`btn btn-primary follow-button ${isFollowing ? 'unfollow' : 'follow'}`}
      onClick={isFollowing ? unfollow : follow}
    >
      {isFollowing ? 'Dejar de seguir' : 'Seguir'}
    </button>
  );
}
