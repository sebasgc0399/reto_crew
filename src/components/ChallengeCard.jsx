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
  where,
  updateDoc 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebaseConfig';
import './ChallengeCard.css';


// MUI
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export default function ChallengeCard({ challenge, onDeleted, onUpdated }) {
  const {
    id,
    title,
    startDate,
    endDate,
    participantsCount,
    createdBy,
    password,
    maxParticipants
  } = challenge;

  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.uid === createdBy;
  const [isParticipant, setIsParticipant] = useState(false);

  // Nuevo: saber si ya expiró el reto
  const Expired = endDate.toDate();
  const isExpired = new Date() > Expired;

  // Estados y handlers para el diálogo de toggle privacidad
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [newPassword, setNewPassword]             = useState('');
  const [passwordError, setPasswordError]         = useState('');
  const openingPrivate = !password; // NUEVO: si no hay password, al abrir vamos a crear

  const handleTogglePrivacy = () => {
    setNewPassword('');
    setPasswordError('');
    setPrivacyDialogOpen(true);
    setMenuOpen(false); // cerrar menú
  };

  const onConfirmPrivacy = async () => {
    try {
      if (openingPrivate) {
        if (!newPassword.trim()) {
          setPasswordError('Debes escribir una contraseña');
          return;
        }
      }
      // Actualizar el reto en Firestore
      await updateDoc(
        doc(db, 'challenges', id),
        { password: openingPrivate ? newPassword.trim() : null }
      );

      onUpdated({
        id,
        password: openingPrivate
          ? newPassword.trim()
          : null
        });

      setPrivacyDialogOpen(false);
      // Opcional: podrías refrescar la lista o hacer un callback
    } catch (err) {
      console.error('Error al cambiar privacidad:', err);
      setPasswordError('No se pudo actualizar la privacidad');
    }
  };
  //  ─────────────────────────────────────────────────────

  // Menú y diálogos
  const [menuOpen, setMenuOpen]               = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen]   = useState(false);
  const [pwDialogOpen, setPwDialogOpen]       = useState(false);
  const [pwValue, setPwValue]                 = useState('');
  const [pwError, setPwError]                 = useState('');
  const [fullDialogOpen, setFullDialogOpen]   = useState(false);

  const menuRef = useRef();

  // Comprueba si ya estás inscrito
  useEffect(() => {
    async function checkParticipant() {
      if (!user || isOwner) return;
      try {
        const partDoc = await getDoc(
          doc(db, 'challenges', id, 'participants', user.uid)
        );
        setIsParticipant(partDoc.exists());
      } catch (err) {
        console.error('Error comprobando participación:', err);
      }
    }
    checkParticipant();
  }, [user, id, isOwner]);

  // Cierra menú al clicar fuera
  useEffect(() => {
    function handleOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [menuOpen]);

  const start = format(new Date(startDate.seconds * 1000), 'dd/MM/yyyy');
  const end   = format(new Date(endDate.seconds * 1000), 'dd/MM/yyyy');

  /** Navegación a detalle, con verificación de contraseña y cupo */
  const handleView = () => {
    // Si eres owner o participante, navegamos sin más
    if (isOwner || isParticipant) {
      navigate(`/challenges/${id}`);
      return;
    }
    // Si el reto ya está lleno
    if (participantsCount >= (maxParticipants ?? 50)) {
      setFullDialogOpen(true);
      return;
    }
    // Si tiene contraseña, pedimos
    if (password) {
      setPwValue('');
      setPwError('');
      setPwDialogOpen(true);
    } else {
      navigate(`/challenges/${id}`);
    }
  };

  /** Validar y navegar tras contraseña */
  const onConfirmPw = () => {
    if (pwValue === password) {
      setPwDialogOpen(false);
      navigate(`/challenges/${id}`);
    } else {
      setPwError('Contraseña incorrecta');
    }
  };

  /** Eliminar reto completo */
  const performDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      const batch = writeBatch(db);
      const partsSnap = await getDocs(
        collection(db, 'challenges', id, 'participants')
      );
      partsSnap.forEach(d => batch.delete(d.ref));
      const entriesSnap = await getDocs(
        collection(db, 'challenges', id, 'entries')
      );
      entriesSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'challenges', id));
      onDeleted(id);
    } catch (err) {
      console.error('Error al eliminar reto:', err);
      alert('No se pudo eliminar el reto.');
    }
  };

  /** Salir del reto */
  const performLeave = async () => {
    setConfirmLeaveOpen(false);
    try {
      const batch = writeBatch(db);
      // Borrar entradas del usuario
      const entriesQuery = query(
        collection(db, 'challenges', id, 'entries'),
        where('userId', '==', user.uid)
      );
      const entriesSnap = await getDocs(entriesQuery);
      entriesSnap.forEach(d => batch.delete(d.ref));
      // Borrar participante
      batch.delete(
        doc(db, 'challenges', id, 'participants', user.uid)
      );
      await batch.commit();
      onUpdated({
        id,
        participantsCount: participantsCount - 1
      });
      onDeleted(id);
    } catch (err) {
      console.error('Error al salir del reto:', err);
      alert('No se pudo salir del reto.');
    }
  };

  return (
    <div className="challenge-card" style={{ position: 'relative' }}>
      {/* Menú de opciones */}
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
              {isOwner && <li onClick={handleTogglePrivacy}>{password ? 'Hacer público' : 'Hacer privado'}</li>}
              {isOwner && !isExpired && <li onClick={() => { setMenuOpen(false); navigate(`/challenges/${id}/edit`); }}>Editar</li>}
              {isOwner && !isExpired && <li onClick={() => { setMenuOpen(false); setConfirmDeleteOpen(true); }}>Eliminar</li>}
              {!isOwner && isParticipant && <li onClick={() => { setMenuOpen(false); setConfirmLeaveOpen(true); }}>Salir</li>}
            </ul>
          )}
        </div>
      )}

      {/* Candado si es privado */}
      <h3 className="challenge-card__title">
        {title}{' '}
        {password && <LockIcon fontSize="small" style={{ verticalAlign: 'middle' }} />}
      </h3>

      <p className="challenge-card__dates">{start} → {end}</p>
      <p className="challenge-card__participants">
        Participantes: {participantsCount}
      </p>

      <button className="btn btn-outline-primary" onClick={handleView}>
        Ver
      </button>
      
      {/* ── Diálogo: Toggle privacidad ── */}
      <Dialog open={privacyDialogOpen} onClose={() => setPrivacyDialogOpen(false)}>
        <DialogTitle>
          {openingPrivate ? 'Hacer reto privado' : 'Hacer reto público'}
        </DialogTitle>
        <DialogContent>
          {openingPrivate ? (
            <>
              <DialogContentText>
                Ingresa la contraseña para proteger este reto.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Nueva contraseña"
                type="password"
                fullWidth
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
              />
            </>
          ) : (
            <DialogContentText>
              Confirmas que este reto ya no será privado y cualquiera podrá verlo?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyDialogOpen(false)}>Cancelar</Button>
          <Button onClick={onConfirmPrivacy} variant="contained">
            {openingPrivate ? 'Proteger' : 'Hacer público'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: eliminar */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Eliminar reto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro quieres eliminar <strong>{title}</strong>? Esta acción <strong>no</strong> se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={performDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: salir */}
      <Dialog open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)}>
        <DialogTitle>Salir del reto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro quieres salir del reto <strong>{title}</strong>? Se eliminarán todos tus registros.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeaveOpen(false)}>Cancelar</Button>
          <Button onClick={performLeave} color="secondary" variant="contained">Salir</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: pedir contraseña */}
      <Dialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)}>
        <DialogTitle>Reto privado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ingresa la contraseña para acceder al reto <strong>{title}</strong>.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Contraseña"
            type="password"
            fullWidth
            value={pwValue}
            onChange={e => setPwValue(e.target.value)}
            error={!!pwError}
            helperText={pwError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialogOpen(false)}>Cancelar</Button>
          <Button onClick={onConfirmPw} variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: reto lleno */}
      <Dialog open={fullDialogOpen} onClose={() => setFullDialogOpen(false)}>
        <DialogTitle>Reto lleno</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este reto ya alcanzó el límite de {maxParticipants ?? 50} participantes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFullDialogOpen(false)}>Entendido</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
