// src/components/ChallengeCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate }    from 'react-router-dom';
import { useAuth }        from '../contexts/AuthContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { format }         from 'date-fns';
import { db }             from '../firebaseConfig';
import './ChallengeCard.css';

export default function ChallengeCard({ challenge, onDeleted }) {
  const { id, title, startDate, endDate, participantsCount, createdBy } = challenge;
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const isOwner           = user?.uid === createdBy;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef           = useRef();

  // Cerrar menú si clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleView = () => navigate(`/challenges/${id}`);
  const handleEdit = () => {
    setMenuOpen(false);
    navigate(`/challenges/${id}/edit`);
  };
  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm('¿Eliminar este reto? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'challenges', id));
      onDeleted(id);
    } catch (err) {
      console.error('Error al eliminar reto:', err);
      alert('No se pudo eliminar el reto.');
    }
  };

  const start = format(new Date(startDate.seconds * 1000), 'dd/MM/yyyy');
  const end   = format(new Date(endDate.seconds * 1000),   'dd/MM/yyyy');

  return (
    <div className="challenge-card" style={{ position: 'relative' }}>
      {isOwner && (
        <div className="challenge-card__menu" ref={menuRef}>
          <button
            className="challenge-card__menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Opciones"
          >
            ⋮
          </button>
          {menuOpen && (
            <ul className="challenge-card__dropdown">
              <li onClick={handleEdit}>Editar</li>
              <li onClick={handleDelete}>Eliminar</li>
            </ul>
          )}
        </div>
      )}

      <h3 className="challenge-card__title">{title}</h3>
      <p className="challenge-card__dates">
        {start} →{' '} {end}
      </p>
      <p className="challenge-card__participants">
        Participantes: {participantsCount}
      </p>
      <button className="btn btn-outline-primary" onClick={handleView}>
        Ver
      </button>
    </div>
  );
}
