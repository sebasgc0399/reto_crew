import React from 'react';
import './FormField.css';


export default function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
  ...rest
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && ''}
      </label>
      <textarea
        className="form-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        {...rest}
      />
    </div>
  );
}
