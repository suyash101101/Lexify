import React from 'react';
import PropTypes from 'prop-types';

const variants = {
  primary: 'bg-gradient-to-b from-gray-800 to-gray-950 hover:[background-image:none] bg-black active:bg-gray-900 text-white border-none',
  secondary: 'bg-accent-white hover:bg-accent-gray text-primary-main border-[0.5px] border-black/15',
  outline: 'bg-transparent border-[0.5px] border-black/15 text-primary-main hover:bg-accent-gray',
};

const sizes = {
  sm: 'text-[0.95rem] px-3 pt-[0.65rem] pb-[0.75rem]',
  md: 'text-[1.05rem] px-4 pt-[0.75rem] pb-[0.85rem]',
  lg: 'text-[1.15rem] px-6 pt-[0.85rem] pb-[0.95rem]',
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
        ${rounded ? 'rounded-xl' : 'rounded-lg'}
        font-semibold
        -tracking-[0.01rem]
        leading-none
        whitespace-nowrap
        transition-colors
        shadow-button-light
        select-none
        active:shadow-none 
        active:ring-[0.5px]
        active:ring-zinc-900/10
        focus-visible:outline-none 
        focus-visible:ring-1
        focus-visible:ring-ring
        ${disabled ? 'disabled:pointer-events-none disabled:opacity-50' : 'cursor-pointer'}
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