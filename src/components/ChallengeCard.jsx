import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebaseConfig';
import './ChallengeCard.css';

// Componentes de MUI para el diálogo de confirmación
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

export default function ChallengeCard({ challenge, onDeleted }) {
  const { id, title, startDate, endDate, participantsCount, createdBy } = challenge;
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.uid === createdBy;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false); // Control del diálogo
  const menuRef = useRef();

  // Cerrar menú si clic fuera…
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

  // Abre el diálogo de confirmación
  const handleDeleteClick = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  // Operación real de borrado tras confirmar
  const performDelete = async () => {
    setConfirmOpen(false);
    try {
      // Batch para borrar subcolecciones
      const batch = writeBatch(db);

      // Borrar participantes
      const partsSnap = await getDocs(collection(db, 'challenges', id, 'participants'));
      partsSnap.forEach(d => batch.delete(d.ref));

      // Borrar entradas
      const entriesSnap = await getDocs(collection(db, 'challenges', id, 'entries'));
      entriesSnap.forEach(d => batch.delete(d.ref));

      // Ejecutar batch
      await batch.commit();

      // Borrar el documento del reto
      await deleteDoc(doc(db, 'challenges', id));

      // Notificar al padre
      onDeleted(id);
    } catch (err) {
      console.error('Error al eliminar reto:', err);
      alert('No se pudo eliminar el reto.');
    }
  };

  const start = format(new Date(startDate.seconds * 1000), 'dd/MM/yyyy');
  const end = format(new Date(endDate.seconds * 1000), 'dd/MM/yyyy');

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
              <li onClick={handleDeleteClick}>Eliminar</li>
            </ul>
          )}
        </div>
      )}

      {/* Diálogo de confirmación personalizado */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">Eliminar reto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar <strong>{title}</strong>? Esta acción <strong>no</strong> se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={performDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <h3 className="challenge-card__title">{title}</h3>
      <p className="challenge-card__dates">
        {start} → {end}
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
