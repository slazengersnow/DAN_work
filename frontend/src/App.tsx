// frontend/src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import MonthlyReport from './pages/MonthlyReport';
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import './App.css';

const queryClient = new QueryClient();

// ProtectedRouteのロジックを実装
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole?: string 
}) => {
  // 開発中は常に認証済みとする
  // const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isAuthenticated = true; // 開発用に強制的に認証済みとする
  
  // 開発中は常に管理者権限に設定
  const userRole = 'admin';
  
  if (!isAuthenticated) {
    // 未認証の場合はログインページにリダイレクト
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    // 権限がない場合は未認証ページにリダイレクト
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// ルーターの定義
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "employee-list", // 社員リスト
        element: <EmployeeList />,
      },
      {
        path: "monthly-report", // 月次報告
        element: <MonthlyReport />,
      },
      {
        path: "payment-report", // 納付金申告
        element: <PaymentReport />,
      },
      {
        path: "settings", // 設定
        element: (
          <ProtectedRoute requiredRole="admin">
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />, // 存在しないパスはダッシュボードにリダイレクト
      }
    ]
  }
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;