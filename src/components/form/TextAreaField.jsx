import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './FormField.css';


export default function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
  tooltip,
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
