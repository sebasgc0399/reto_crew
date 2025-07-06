import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './FormField.css';


export default function DateField({
  label,
  selected,
  onChange,
  required = false
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && '*'}
      </label>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        placeholderText="dd/MM/yyyy"
        className="form-input"
        required={required}
      />
    </div>
  );
}
