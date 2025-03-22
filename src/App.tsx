// src/App.tsx - メインコンポーネント（簡易版）
import React, { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';
import { Employee } from './types/Employee';

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

  // プレースホルダーコンポーネント
  const PlaceholderView = ({ title }: { title: string }) => (
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