// src/components/NamePopup.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField as MuiTextField,
  CircularProgress
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './NamePopup.css'; // Importar nuestro CSS personalizado

export default function NamePopup({ open, onClose, onSubmit, currentUid }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleConfirm = async () => {
    const trimmed = name.trim();
    setError('');

    // 1) Validaciones básicas
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (trimmed.length > 25) {
      setError('No puede tener más de 25 caracteres.');
      return;
    }

    // 2) Verificar unicidad en Firestore
    setChecking(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('name', '==', trimmed)
      );
      const snap = await getDocs(q);
      if (snap.docs.some(docSnap => docSnap.id !== currentUid)) {
        setError('Ese nombre ya está en uso.');
      } else {
        onSubmit(trimmed);
      }
    } catch (err) {
      console.error(err);
      setError('Error al verificar el nombre.');
    } finally {
      setChecking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !checking && name.trim()) {
      handleConfirm();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      className="name-popup-dialog"
      disableEscapeKeyDown={checking}
      aria-labelledby="name-popup-title"
      aria-describedby="name-popup-description"
    >
      <DialogTitle 
        id="name-popup-title"
        className="name-popup-title"
      >
        Elige tu nombre de usuario
      </DialogTitle>
      
      <DialogContent className="name-popup-content">
        <div className={`name-popup-textfield ${error ? 'error-state' : ''}`}>
          <MuiTextField
            autoFocus
            margin="dense"
            label="Nombre de usuario"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!error}
            helperText={error || 'Máximo 25 caracteres, único en la plataforma.'}
            inputProps={{ 
              maxLength: 25,
              'aria-describedby': 'name-popup-description'
            }}
            disabled={checking}
          />
          <div 
            className={`character-counter ${name.length > 20 ? 'warning' : ''}`}
            aria-live="polite"
          >
            {name.length}/25
          </div>
        </div>
        
        <div 
          id="name-popup-description" 
          className="sr-only"
        >
          Ingresa un nombre de usuario único que te identifique en la plataforma. 
          Debe tener máximo 25 caracteres.
        </div>
      </DialogContent>
      
      <DialogActions className="name-popup-actions">
        <div className="name-popup-button cancel-button">
          <Button 
            onClick={onClose} 
            disabled={checking}
            aria-label="Cancelar y cerrar el popup"
          >
            Cancelar
          </Button>
        </div>
        
        <div className={`name-popup-button confirm-button ${checking ? 'loading' : ''}`}>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            disabled={checking || !name.trim()}
            aria-label={checking ? 'Verificando nombre...' : 'Confirmar nombre de usuario'}
          >
            <div className="loading-indicator">
              {checking && <CircularProgress size={20} />}
              <span>{checking ? 'Verificando...' : 'Continuar'}</span>
            </div>
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}

NamePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  currentUid: PropTypes.string
};