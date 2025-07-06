import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './FormField.css';


export default function NumberField({
  label,
  value,
  onChange,
  required = false,
  tooltip
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && '*'}
        {tooltip && (
          <Tippy
            content={tooltip}
            placement="right"
            delay={[200,0]}
            arrow
            appendTo={() => document.body}
          >
            <span className="info-icon">ℹ️</span>
          </Tippy>
        )}
      </label>
      <input
        type="number"
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        step="0.1"
        required={required}
      />
    </div>
  );
}
