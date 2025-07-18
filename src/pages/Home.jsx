import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import GoogleButton from '../components/GoogleButton';
import NamePopup     from '../components/NamePopup';
import BirthdayPopup from '../components/BirthdayPopup'
import PageTitle from '../components/PageTitle';
import Subtitle from '../components/Subtitle';
import Lottie from 'lottie-react';
import pushupAnimation from '../animations/pushup.json';
import './Home.css';

export default function Home() {
  const [error, setError]         = useState('');
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false)
  const [pendingUser, setPendingUser]     = useState(null);
  const navigate = useNavigate();

  async function handleGoogleAuth() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider)
      const fu      = result.user
      const userRef = doc(db, 'users', fu.uid)

      await setDoc(userRef, {
        uid:       fu.uid,
        email:     fu.email,
        photoURL:  fu.photoURL,
        lastLogin: serverTimestamp()
      }, { merge: true })
      
      // 2) Ahora leemos para ver si createdAt y nombre ya existe
      const snap = await getDoc(userRef);
      const data = snap.data() || {};

      if (!data.createdAt) {
        // sólo si no existe, lo creamos
        await updateDoc(userRef, {
          createdAt: serverTimestamp()
        });
      }

      // 3) nombre
      if (!data.name) {
        setPendingUser(fu)
        setShowNamePopup(true)
      } else if (!data.birthDate) {
        // 4) si ya tiene nombre pero no birthDate
        setPendingUser(fu)
        setShowBirthdayPopup(true)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (e) {
      console.error(e)
      setError('No fue posible autenticarse. Intenta de nuevo.')
    }
  }

  const handleNameSubmit = async trimmedName => {
    if (!pendingUser) return
    try {
      await updateProfile(auth.currentUser, { displayName: trimmedName })
      const userRef = doc(db, 'users', pendingUser.uid)
      await updateDoc(userRef, { name: trimmedName })

      setShowNamePopup(false)
      setShowBirthdayPopup(true)
    } catch (e) {
      console.error(e)
      setError('No fue posible guardar el nombre.')
    }
  }

  const handleBirthdaySubmit = async date => {
    if (!pendingUser) return
    try {
      const userRef = doc(db, 'users', pendingUser.uid)
      await updateDoc(userRef, {
        birthDate: Timestamp.fromDate(date)
      })
      setShowBirthdayPopup(false)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      console.error(e)
      setError('No fue posible guardar la fecha de nacimiento.')
    }
  }

  return (
    <div className="home-container">
      <PageTitle level={1}>¡Bienvenido a RetoCrew!</PageTitle>
      <Subtitle>
        Registra tus flexiones y compite con amigos de manera justa.
      </Subtitle>

      <GoogleButton onClick={handleGoogleAuth} />
      {error && <p className="text-danger mt-2">{error}</p>}

      <div className="home-animation">
        <Lottie animationData={pushupAnimation} loop={false} />
      </div>

      <NamePopup
        open={showNamePopup}
        onClose={() => setShowNamePopup(false)}
        onSubmit={handleNameSubmit}
        currentUid={pendingUser?.uid}
      />

      <BirthdayPopup
        open={showBirthdayPopup}
        onClose={() => setShowBirthdayPopup(false)}
        onSubmit={handleBirthdaySubmit}
      />

    </div>
  );
}
