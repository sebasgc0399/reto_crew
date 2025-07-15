// src/components/profile/ShareButton.jsx
import React, { useRef, useState } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../animations/share.json';
import './ShareButton.css';

export default function ShareButton() {
  const lottieRef = useRef(null);
  const [msg, setMsg] = useState('');

  const handleClick = async () => {
    lottieRef.current?.goToAndPlay(0, true);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi perfil en RetoCrew',
          url: window.location.href
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setMsg('Enlace copiado');
      setTimeout(() => setMsg(''), 2000);
    }
  };

  return (
    <div className="share-wrapper">
      <button className="share-btn" onClick={handleClick}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          style={{ width: 36, height: 36 }}
        />
      </button>
      {msg && <span className="share-msg">{msg}</span>}
    </div>
  );
}