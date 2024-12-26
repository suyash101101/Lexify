import React from 'react';
import PropTypes from 'prop-types';

export const Card = ({ 
  children, 
  className = '',
  hover = true,
  ...props 
}) => {
  return (
    <div
      className={`
        bg-accent-white rounded-lg
        border border-primary-main/5
        p-6
        ${hover ? 'transition-all duration-200 hover:border-primary-main/20' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
}; 