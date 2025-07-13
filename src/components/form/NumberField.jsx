// src/components/form/NumberField.jsx
import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './FormField.css';

export default function NumberField({
  label,
  value,
  onChange,
  required = false,
  tooltip,
  // seguimos aceptando min, max, step arriba
  min,
  max,
  step = 'any',
  // Y además inputProps para cualquier otra cosa
  inputProps = {},
  ...rest
}) {
  const handleChange = e => {
    const val = e.target.value;
    const num = Number(val);
    if (val !== '' && isNaN(num)) return;
    if (min != null && num < min) return;
    if (max != null && num > max) return;
    onChange(val);
  };

  // fusionamos: primero min/max/step, luego lo que venga en inputProps
  const finalInputProps = { min, max, step, ...inputProps };

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && '*'}
        {tooltip && (
          <Tippy
            content={tooltip}
            placement="right"
            delay={[200, 0]}
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
        onChange={handleChange}
        required={required}
        {...finalInputProps}
        {...rest} 
      />
    </div>
  );
}
