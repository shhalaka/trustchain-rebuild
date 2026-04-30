import React from 'react';

function Spinner({ size = 16, className = '' }) {
  return (
    <span
      className={`spinner ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
      aria-hidden="true"
    />
  );
}

export default Spinner;
