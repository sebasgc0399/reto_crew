import React from 'react';
import PropTypes from 'prop-types';
import './Subtitle.css';

export default function Subtitle({ children, className = '', ...rest }) {
  return (
    <p className={`subtitle ${className}`} {...rest}>
      {children}
    </p>
  );
}

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
