// src/components/Breadcrumbs.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// 基本的なパスのマッピング
const pathMap: { [key: string]: string } = {
  'dashboard': 'ダッシュボード',
  'employee-list': '社員リスト',
  'monthly-report': '月次報告',
  'payment-report': '納付金申告',
  'settings': '設定'
};

// 各ページのタブマッピング
const tabMap: { [key: string]: { [key: string]: string } } = {
  'monthly-report': {
    'summary': 'サマリー',
    'employees': '従業員詳細',
    'monthly': '月次詳細'
  },
  'payment-report': {
    'summary': 'サマリー',
    'monthly': '月別データ',
    'payment': '納付金情報',
    'history': '申告履歴'
  }
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  
  // パスセグメントとクエリパラメータを取得
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab');
  
  // パンくずリストアイテムを格納する配列
  const breadcrumbItems: { path: string; label: string }[] = [];
  
  // ホームリンクを追加
  breadcrumbItems.push({ path: '/', label: 'ホーム' });
  
  // 基本的なパスセグメントを処理
  let currentPath = '';
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const label = pathMap[segment] || segment;
    breadcrumbItems.push({ path: currentPath, label });
    
    // 最後のセグメントの場合はタブ情報も追加
    if (segment === pathSegments[pathSegments.length - 1] && activeTab) {
      // 該当ページのタブマッピングが存在するか確認
      const tabs = tabMap[segment];
      if (tabs && tabs[activeTab]) {
        breadcrumbItems.push({
          path: `${currentPath}?tab=${activeTab}`,
          label: tabs[activeTab]
        });
      }
    }
  }
  
  return (
    <div className="breadcrumbs" style={{ 
      padding: '0.5rem 1rem', 
      background: '#f5f5f5', 
      borderRadius: '4px',
      marginBottom: '1rem',
      fontSize: '0.9rem'
    }}>
      {breadcrumbItems.map((item, index) => (
        <span key={`${item.path}-${index}`}>
          {index > 0 && <span style={{ margin: '0 0.5rem', color: '#666' }}>&gt;</span>}
          {index === breadcrumbItems.length - 1 ? (
            <span style={{ color: '#666' }}>{item.label}</span>
          ) : (
            <Link to={item.path} style={{ color: '#0066cc', textDecoration: 'none' }}>
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumbs;