import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  // 現在のパスに基づいてアクティブなリンクを判断
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="menu-title">メニュー</div>
      
      <Link to="/" className={`menu-item ${isActive('/') || isActive('/dashboard') ? 'selected' : ''}`}>
        ダッシュボード
      </Link>
      
      <Link to="/employee-list" className={`menu-item ${isActive('/employee-list') ? 'selected' : ''}`}>
        社員リスト
      </Link>
      
      <Link to="/monthly-report" className={`menu-item ${isActive('/monthly-report') ? 'selected' : ''}`}>
        月次報告
      </Link>
      
      <Link to="/payment-report" className={`menu-item ${isActive('/payment-report') ? 'selected' : ''}`}>
        納付金申告
      </Link>
      
      <Link to="/settings" className={`menu-item ${isActive('/settings') ? 'selected' : ''}`}>
        設定
      </Link>
    </div>
  );
};

export default Sidebar;