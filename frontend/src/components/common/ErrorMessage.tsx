import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const errorStyle = {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '10px',
    borderRadius: '4px',
    margin: '10px 0'
  };

  return (
    <div style={errorStyle} className="error-message">
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;