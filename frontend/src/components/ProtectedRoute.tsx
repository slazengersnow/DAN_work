// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // 開発モードでは認証をバイパス
  const isAuthenticated = true; // 開発中は常にtrueに設定
  const userRole = 'admin'; // 開発中は管理者として扱う
  
  if (!isAuthenticated) {
    // 未認証の場合はログインページにリダイレクト
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    // 権限がない場合は未認証ページにリダイレクト
    return <Navigate to="/unauthorized" replace />;
  }
  
  // 認証・権限OKの場合は子コンポーネントを表示
  return <>{children}</>;
};

export default ProtectedRoute;