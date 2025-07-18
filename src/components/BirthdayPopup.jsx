// src/components/BirthdayPopup.jsx
import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './BirthdayPopup.css'

export default function BirthdayPopup({ open, onClose, onSubmit }) {
  const [date, setDate] = useState(null)
  const [error, setError] = useState('')

  const handleOk = () => {
    if (!date) {
      setError('Por favor selecciona tu fecha de nacimiento.')
      return
    }
    onSubmit(date)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: 'birthday-dialog-paper' }}
    >
      <DialogTitle className="birthday-dialog-title">
        ¿Cuál es tu fecha de nacimiento?
      </DialogTitle>
      <DialogContent className="birthday-dialog-content">
        <ReactDatePicker
          selected={date}
          onChange={d => { setDate(d); setError('') }}
          dateFormat="dd/MM/yyyy"
          maxDate={new Date()}
          showYearDropdown
          scrollableYearDropdown
          dropdownMode="select"
          placeholderText="Selecciona fecha"
          className="birthday-datepicker-input"
        />
        {error && <p className="birthday-error-text">{error}</p>}
      </DialogContent>
      <DialogActions className="birthday-dialog-actions">
        <Button onClick={onClose} className="birthday-btn-cancel">
          Cancelar
        </Button>
        <Button onClick={handleOk} variant="contained" className="birthday-btn-save">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
