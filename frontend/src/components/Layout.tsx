// src/components/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div className="layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* サイドバー */}
      <Sidebar />
      
      {/* メインコンテンツエリア */}
      <div className="main-container" style={{ flex: 1, padding: '20px', background: '#f5f7fa' }}>
        {/* パンくずリスト */}
        <Breadcrumbs />
        
        {/* メインコンテンツ - Outletを通してルートのコンポーネントが表示される */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;