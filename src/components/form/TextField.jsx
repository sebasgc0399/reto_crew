import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './FormField.css';


export default function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  tooltip,
  ...rest
}) {
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
