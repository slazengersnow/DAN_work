// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import MonthlyReport from './pages/MonthlyReport';
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import './App.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/employee-list" element={
            <ProtectedRoute>
              <Layout>
                <EmployeeList />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/monthly-report" element={
            <ProtectedRoute>
              <Layout>
                <MonthlyReport />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/payment-report" element={
            <ProtectedRoute>
              <Layout>
                <PaymentReport />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;