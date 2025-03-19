import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import MonthlyReport from './pages/MonthlyReport';
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { saveToLocalStorage, getFromLocalStorage } from './utils/storage';

function App() {
  // テーマ状態の初期化（ローカルストレージから取得、デフォルトは'light'）
  // nullが返される可能性があるため、|| 'light' で確実に文字列に
  const [theme, setTheme] = useState<string>(() => {
    return getFromLocalStorage('theme', 'light') || 'light';
  });

  // テーマ変更関数
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    saveToLocalStorage('theme', newTheme);
  };

  // テーマが変更されたときにドキュメントのクラスを更新
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="content-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/monthly-report" element={<MonthlyReport />} />
              <Route path="/payment-report" element={<PaymentReport />} />
              <Route path="/settings" element={<Settings theme={theme} onChangeTheme={changeTheme} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;