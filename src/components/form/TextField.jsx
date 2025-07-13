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
  maxLength,
  validateRegex,
  ...rest
}) {

  const handleChange = e => {
    let val = e.target.value;

    if (maxLength != null && val.length > maxLength) {
      val = val.slice(0, maxLength);
    }

    val = val.replace(/<[^>]*>/g, '');

    if (validateRegex && !validateRegex.test(val)) {
      return;
    }

    onChange(val);
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
        type={type}
        className="form-input"
        value={value}
        onChange={handleChange}
        required={required}
        maxLength={maxLength}
        {...rest}
      />
    </div>
  );
}
