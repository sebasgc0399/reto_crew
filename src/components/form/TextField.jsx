import React from 'react';
import './FormField.css';


export default function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  ...rest
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        {...rest}
      />
    </div>
  );
}
