import React from 'react';
import './FormField.css';

export default function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
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
      </label>
      <textarea
        className="form-textarea"
        value={value}
        onChange={handleChange}
        rows={rows}
        maxLength={maxLength}
        required={required}
        {...rest}
      />
    </div>
  );
}
