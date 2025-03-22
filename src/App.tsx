// src/App.tsx - 完全版メインコンポーネント
import React, { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';
import { Employee } from './types/Employee';

// 各ページコンポーネントをインポート
import Dashboard from './pages/Dashboard';
import MonthlyReport from './pages/MonthlyReport';
import PaymentReport from './pages/PaymentReport';
import Settings from './pages/Settings';

// スタイルシートのインポート
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

  // 現在のビューに基づいてコンテンツを表示
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'employeeList':
        return <EmployeeList onEmployeeSelect={showEmployeeDetail} />;
      case 'employeeDetail':
        return <EmployeeDetail employee={selectedEmployee} onBack={backToList} />;
      case 'monthlyReport':
        return <MonthlyReport />;
      case 'financialReport':
        return <PaymentReport />;
      case 'settings':
        return <Settings />;
      default:
        return <EmployeeList onEmployeeSelect={showEmployeeDetail} />;
    }
  };

  return (
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
  );
};

export default App;