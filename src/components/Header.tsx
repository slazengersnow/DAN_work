import React from 'react';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  
  // 現在のパスに基づいてページタイトルを設定
  const getPageTitle = (): string => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'ダッシュボード';
      case '/employee-list':
        return '社員リスト';
      case '/monthly-report':
        return '月次報告';
      case '/payment-report':
        return '納付金申告';
      case '/settings':
        return '設定';
      default:
        return 'ダッシュボード';
    }
  };

  return (
    <div className="header">
      <div className="header-title">{getPageTitle()}</div>
      <div className="user-info">
        <span>管理者</span>
        <a href="/logout">ログアウト</a>
      </div>
    </div>
  );
};

export default Header;