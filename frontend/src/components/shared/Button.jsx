import React from 'react';
import PropTypes from 'prop-types';

const variants = {
  primary: 'bg-primary-main hover:bg-primary-light text-accent-white border border-transparent',
  secondary: 'bg-accent-white hover:bg-accent-gray text-primary-main border border-primary-main/10',
  outline: 'bg-transparent border border-primary-main text-primary-main hover:bg-accent-gray',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  rounded = true,
  onClick,
  type = 'button',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        inline-flex items-center justify-center
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        font-medium
        transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  rounded: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string,
}; 