import React, { useEffect, useState } from 'react';
import './ImportNotificationEnhancer.css';

interface ImportNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const ImportNotification: React.FC<ImportNotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
  autoHideDuration = 3000
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timeoutId = setTimeout(() => {
        setIsExiting(true);
        const animationTime = 300;
        setTimeout(() => {
          setIsExiting(false);
          onClose();
        }, animationTime);
      }, autoHideDuration);

      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, onClose, autoHideDuration]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch(type) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'info':
        return 'i';
      default:
        return '';
    }
  };

  return (
    <div className={`import-notification ${type} ${isExiting ? 'exiting' : ''}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-message">{message}</div>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
};

export default ImportNotification;