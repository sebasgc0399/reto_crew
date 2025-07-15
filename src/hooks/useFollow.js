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
    if (!myUid) return;

    const followersCol = collection(db, 'users', targetUid, 'followers');
    const followingCol = collection(db, 'users', myUid, 'following');

    // Escuchamos en tiempo real los cambios de conteo
    const unsubFollowers = onSnapshot(followersCol, snap => {
      setFollowers(snap.size);
    });
    const unsubFollowing = onSnapshot(followingCol, snap => {
      setFollowing(snap.size);
    });

    // Sabemos si yo sigo al target
    const unsubIsFollowing = onSnapshot(
      doc(db, 'users', targetUid, 'followers', myUid),
      docSnap => {
        setIsFollowing(docSnap.exists());
      }
    );

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubIsFollowing();
    };
  }, [myUid, targetUid]);

  const follow = useCallback(async () => {
    if (!myUid) return;
    // Agregamos la relación en ambos subcolecciones
    await Promise.all([
      setDoc(doc(db, 'users', targetUid, 'followers', myUid), {}),
      setDoc(doc(db, 'users', myUid, 'following', targetUid), {}),
    ]);
  }, [myUid, targetUid]);

  const unfollow = useCallback(async () => {
    if (!myUid) return;
    // Borramos la relación en ambos sitios
    await Promise.all([
      deleteDoc(doc(db, 'users', targetUid, 'followers', myUid)),
      deleteDoc(doc(db, 'users', myUid, 'following', targetUid)),
    ]);
  }, [myUid, targetUid]);

  return { followers, following, isFollowing, follow, unfollow };
}
