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
  min,
  max,
  step = 'any',
  inputProps = {},
  ...rest
}) {
  const handleChange = e => {
    const val = e.target.value;

    // 1) Permitimos borrar todo
    if (val === '') {
      onChange('');
      return;
    }
    // 2) Sólo números
    const num = Number(val);
    if (isNaN(num)) return;
    // 3) Validamos rango en JS
    if (min != null && num < min) return;
    if (max != null && num > max) return;

    onChange(val);
  };

  // Sólo metemos step + todo lo demás que realmente quieras:
  const finalInputProps = {
    step,
    ...inputProps
  };

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
