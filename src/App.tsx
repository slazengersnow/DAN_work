<<<<<<< Updated upstream
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import MonthlyReport from './pages/MonthlyReport';
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';
=======
// src/App.tsx - メインコンポーネント（メニュー機能強化版）
import React, { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';
import { Employee } from './types/Employee';

// スタイルシートのインポート
>>>>>>> Stashed changes
import './App.css';
import './styles/employee-management.css';

// ビューの型定義
type ViewType = 'dashboard' | 'employeeList' | 'employeeDetail' | 'monthlyReport' | 'financialReport' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('employeeList');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // 社員詳細画面を表示する関数
  const showEmployeeDetail = (employee: Employee): void => {
    setSelectedEmployee(employee);
    setCurrentView('employeeDetail');
  };

  // 社員一覧に戻る関数
  const backToList = (): void => {
    setCurrentView('employeeList');
    setSelectedEmployee(null);
  };

  // メニュー項目クリック時のハンドラー
  const handleMenuClick = (view: ViewType): void => {
    // 社員詳細から別のビューに移動する場合は選択中の社員情報をクリア
    if (view !== 'employeeDetail') {
      setSelectedEmployee(null);
    }
    setCurrentView(view);
  };

  // プレースホルダーコンポーネント - 実際の実装では適切なコンポーネントに置き換える
  const PlaceholderView: React.FC<{ title: string }> = ({ title }) => (
    <div className="placeholder-container">
      <h2 className="section-title">{title}</h2>
      <div className="placeholder-content">
        <p>この機能は現在開発中です。</p>
        <p>今後のアップデートをお待ちください。</p>
      </div>
    </div>
  );

  // 現在のビューに基づいてコンテンツを表示
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <PlaceholderView title="ダッシュボード" />;
      case 'employeeList':
        return <EmployeeList onEmployeeSelect={showEmployeeDetail} />;
      case 'employeeDetail':
        return <EmployeeDetail employee={selectedEmployee} onBack={backToList} />;
      case 'monthlyReport':
        return <PlaceholderView title="月次報告" />;
      case 'financialReport':
        return <PlaceholderView title="納付金申告" />;
      case 'settings':
        return <PlaceholderView title="設定" />;
      default:
        return <EmployeeList onEmployeeSelect={showEmployeeDetail} />;
    }
  };

  return (
<<<<<<< Updated upstream
    <Router>
      <div className="app-container">
        {/* サイドバーを常に表示 */}
        <Sidebar />
        
        <div className="main-content">
          <Header />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employee-list" element={<EmployeeList />} />
              <Route path="/monthly-report" element={<MonthlyReport />} />
              <Route path="/payment-report" element={<PaymentReport />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
=======
    <div className="app">
      <header className="header">
        <h1>DIwork</h1>
      </header>
      
      <div className="container">
        <div className="sidebar">
          <div className="menu-title">メニュー</div>
          <ul className="menu-list">
            <li 
              className={`menu-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleMenuClick('dashboard')}
            >
              ダッシュボード
            </li>
            <li 
              className={`menu-item ${currentView === 'employeeList' ? 'active' : ''}`}
              onClick={() => handleMenuClick('employeeList')}
            >
              社員リスト
            </li>
            <li 
              className={`menu-item ${currentView === 'monthlyReport' ? 'active' : ''}`}
              onClick={() => handleMenuClick('monthlyReport')}
            >
              月次報告
            </li>
            <li 
              className={`menu-item ${currentView === 'financialReport' ? 'active' : ''}`}
              onClick={() => handleMenuClick('financialReport')}
            >
              納付金申告
            </li>
            <li 
              className={`menu-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => handleMenuClick('settings')}
            >
              設定
            </li>
          </ul>
        </div>
        
        <div className="content">
          {renderContent()}
        </div>
      </div>
    </div>
>>>>>>> Stashed changes
  );
};

export default App;