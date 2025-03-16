import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="menu-title">メニュー</div>
      <NavLink to="/dashboard" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
        ダッシュボード
      </NavLink>
      <NavLink to="/employees" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
        社員リスト
      </NavLink>
      <NavLink to="/monthly-report" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
        月次報告
      </NavLink>
      <NavLink to="/payment-report" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
        納付金申告
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
        設定
      </NavLink>
    </aside>
  );
};

export default Sidebar;