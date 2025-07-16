// src/hooks/useFollow.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useFollow(targetUid) {
  const { user } = useAuth();
  const myUid = user?.uid;

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!targetUid || !myUid) return;

    const followersCol = collection(db, 'users', targetUid, 'followers');
    const followingCol = collection(db, 'users', targetUid, 'following');

    const unsub1 = onSnapshot(followersCol, snap => {
      setFollowers(snap.size);
    });
    const unsub2 = onSnapshot(followingCol, snap => {
      setFollowing(snap.size);
    });
    const unsub3 = onSnapshot(
      doc(db, 'users', targetUid, 'followers', myUid),
      snap => setIsFollowing(snap.exists())
    );

    return () => {
      unsub1(); unsub2(); unsub3();
    };
  }, [myUid, targetUid]);

  const follow = useCallback(async () => {
    if (!myUid) return;
    await Promise.all([
      setDoc(doc(db, 'users', targetUid, 'followers', myUid), {}),
      setDoc(doc(db, 'users', myUid, 'following', targetUid), {}),
    ]);
  }, [myUid, targetUid]);

  const unfollow = useCallback(async () => {
    if (!myUid) return;
    await Promise.all([
      deleteDoc(doc(db, 'users', targetUid, 'followers', myUid)),
      deleteDoc(doc(db, 'users', myUid, 'following', targetUid)),
    ]);
  }, [myUid, targetUid]);

  return { followers, following, isFollowing, follow, unfollow };
}
