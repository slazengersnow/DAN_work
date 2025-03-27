// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const location = useLocation();
  
  // トークンの存在を確認
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 権限の確認（必要な場合）
  if (requiredRole) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    const user = JSON.parse(userStr);
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;