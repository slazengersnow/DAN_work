import React from 'react';

const Spinner: React.FC = () => {
  const spinnerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100px'
  };
  
  const loaderStyle = {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    borderTop: '4px solid #3498db',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite'
  };
  
  return (
    <div style={spinnerStyle} className="spinner-container">
      <div style={loaderStyle} className="spinner"></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Spinner;