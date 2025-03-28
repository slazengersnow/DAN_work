// frontend/src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
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
  // 実際のアプリケーションでは認証状態をチェックする
  const isAuthenticated = true; // 開発中はtrueに設定
  const userRole = 'admin'; // 開発中は管理者権限に設定
  
  if (!isAuthenticated) {
    // 未認証の場合はログインページにリダイレクト
    return <Login />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    // 権限がない場合は未認証ページにリダイレクト
    return <Unauthorized />;
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
        <Layout>
          <Outlet />
        </Layout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "employee-list",
        element: <EmployeeList />
      },
      {
        path: "monthly-report",
        element: <MonthlyReport />
      },
      {
        path: "payment-report",
        element: <PaymentReport />
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Settings />
          </ProtectedRoute>
        )
      },
      {
        path: "*",
        element: <Dashboard />
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