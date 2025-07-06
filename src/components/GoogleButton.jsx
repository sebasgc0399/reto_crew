import React from 'react';
import './GoogleButton.css';
import googleIcon from '../assets/google.svg'; // ajusta ruta si hace falta

export default function GoogleButton({ onClick }) {
  return (
    <button className="btn-google" onClick={onClick}>
      <span className="btn-google__icon">
        <img src={googleIcon} alt="Google logo" />
      </span>
      <span className="btn-google__text">
        Iniciar sesión con Google
      </span>
    </button>
  );
}
