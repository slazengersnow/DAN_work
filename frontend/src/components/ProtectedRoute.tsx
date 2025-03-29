// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // 開発モードではログイン認証を常にバイパス
  const isAuthenticated = process.env.REACT_APP_USE_MOCK === 'true' ? true : true; // 常にtrueに設定（開発用）
  const userRole = 'admin'; // 開発中は管理者権限を付与
  
  // 認証チェックをバイパス（開発中）
  return <>{children}</>;
  
  // 本番環境では以下のコードを使用
  /*
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
  */
};

export default ProtectedRoute;