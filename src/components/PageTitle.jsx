import React from 'react';
import PropTypes from 'prop-types';
import './PageTitle.css';

export default function PageTitle({
  children,
  level = 2,
  variant,
  className = '',
  ...rest
}) {
  const Tag = `h${level}`;
  const variantClass = variant ? `page-title--${variant}` : '';
  return (
    <Tag className={`page-title ${variantClass} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

PageTitle.propTypes = {
  children:  PropTypes.node.isRequired,
  level:     PropTypes.oneOf([1,2,3,4,5,6]),
  variant:   PropTypes.oneOf(['no-border','small']),
  className: PropTypes.string
};
