import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import GoogleButton from '../components/GoogleButton';
import Lottie from 'lottie-react';
import pushupAnimation from '../animations/pushup.json';
import './Home.css';

export default function Home() {
  const [error, setError] = useState('');
  const navigate       = useNavigate();

  async function handleGoogleAuth() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fu      = result.user;
      const userRef = doc(db, 'users', fu.uid);

      // Solo crea createdAt si es nuevo
      const isNew = result._tokenResponse?.isNewUser;
      await setDoc(userRef, {
        uid:       fu.uid,
        name:      fu.displayName,
        email:     fu.email,
        photoURL:  fu.photoURL,
        lastLogin: serverTimestamp(),
        ...(isNew && { createdAt: serverTimestamp() })
      }, { merge: true });

      // redirige al dashboard
      navigate('/dashboard', { replace: true });
    } catch (e) {
      console.error(e);
      setError('No fue posible autenticarse. Intenta de nuevo.');
    }
  }

  return (
    <div className="home-container">
      <h1 className="home-title">¡Bienvenido a RetoCrew!</h1>
      <p className="home-subtitle">
        Registra tus flexiones y compite con amigos de manera justa.
      </p>

      <GoogleButton onClick={handleGoogleAuth} />
      {error && <p className="text-danger mt-2">{error}</p>}

      <div className="home-animation">
        <Lottie animationData={pushupAnimation} loop={false} />
      </div>
    </div>
  );
}
