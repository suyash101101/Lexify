import React from 'react';

export const Container = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`
        max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}; 