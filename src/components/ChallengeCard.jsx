import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebaseConfig';
import './ChallengeCard.css';

// Componentes de MUI para los diálogos de confirmación
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
  const [isParticipant, setIsParticipant] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const menuRef = useRef();

  // Verificar si el usuario es participante (y no el creador)
  useEffect(() => {
    async function checkParticipant() {
      if (!user || isOwner) return;
      try {
        const partDoc = await getDoc(doc(db, 'challenges', id, 'participants', user.uid));
        setIsParticipant(partDoc.exists());
      } catch (err) {
        console.error('Error comprobando participación:', err);
      }
    }
    checkParticipant();
  }, [user, id, isOwner]);

  // Cerrar menú si se hace clic fuera
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
  const handleEdit = () => { setMenuOpen(false); navigate(`/challenges/${id}/edit`); };
  const handleDeleteClick = () => { setMenuOpen(false); setConfirmDeleteOpen(true); };
  const handleLeaveClick = () => { setMenuOpen(false); setConfirmLeaveOpen(true); };

  // Eliminar reto completo (propietario)
  const performDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      const batch = writeBatch(db);
      const partsSnap = await getDocs(collection(db, 'challenges', id, 'participants'));
      partsSnap.forEach(d => batch.delete(d.ref));
      const entriesSnap = await getDocs(collection(db, 'challenges', id, 'entries'));
      entriesSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'challenges', id));
      onDeleted(id);
    } catch (err) {
      console.error('Error al eliminar reto:', err);
      alert('No se pudo eliminar el reto.');
    }
  };

  // Salir del reto (participante)
  const performLeave = async () => {
    setConfirmLeaveOpen(false);
    try {
      const batch = writeBatch(db);
      // Borrar sólo las entradas del usuario
      const entriesQuery = query(
        collection(db, 'challenges', id, 'entries'),
        where('userId', '==', user.uid)
      );
      const entriesSnap = await getDocs(entriesQuery);
      entriesSnap.forEach(d => batch.delete(d.ref));
      // Borrar registro del participante
      batch.delete(doc(db, 'challenges', id, 'participants', user.uid));
      await batch.commit();
      onDeleted(id);
    } catch (err) {
      console.error('Error al salir del reto:', err);
      alert('No se pudo salir del reto.');
    }
  };

  const start = format(new Date(startDate.seconds * 1000), 'dd/MM/yyyy');
  const end = format(new Date(endDate.seconds * 1000), 'dd/MM/yyyy');

  return (
    <div className="challenge-card" style={{ position: 'relative' }}>
      {(isOwner || isParticipant) && (
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
              {isOwner && <li onClick={handleEdit}>Editar</li>}
              {isOwner && <li onClick={handleDeleteClick}>Eliminar</li>}
              {!isOwner && isParticipant && <li onClick={handleLeaveClick}>Salir</li>}
            </ul>
          )}
        </div>
      )}

      {/* Diálogo para eliminar reto */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Eliminar reto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro quieres eliminar <strong>{title}</strong>? Esta acción <strong>no</strong> se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={performDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para salir del reto */}
      <Dialog
        open={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        aria-labelledby="confirm-leave-title"
      >
        <DialogTitle id="confirm-leave-title">Salir del reto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro quieres salir del reto <strong>{title}</strong>? Se eliminarán todos tus registros.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeaveOpen(false)}>Cancelar</Button>
          <Button onClick={performLeave} color="secondary" variant="contained">
            Salir
          </Button>
        </DialogActions>
      </Dialog>

      <h3 className="challenge-card__title">{title}</h3>
      <p className="challenge-card__dates">{start} → {end}</p>
      <p className="challenge-card__participants">
        Participantes: {participantsCount}
      </p>
      <button className="btn btn-outline-primary" onClick={handleView}>
        Ver
      </button>
    </div>
  );
}
