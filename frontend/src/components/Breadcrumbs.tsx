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

// サブレベルの状態をマップするための関数型
type SubPathGetter = (pathname: string, search: string) => {path: string, label: string}[] | null;

// 特定のパスに対するサブパスマッピング
const subPathGetters: {[key: string]: SubPathGetter} = {
  // 月次報告のサブパスマッピング
  'monthly-report': (pathname, search) => {
    // URLパラメータからタブを取得
    const params = new URLSearchParams(search);
    const tab = params.get('tab') || 'summary';
    
    // URLの末尾から詳細ページかどうかを判断
    const isDetail = pathname.endsWith('/detail');
    
    // タブの名前マッピング
    const tabNames: {[key: string]: string} = {
      'summary': 'サマリー',
      'employees': '従業員詳細',
      'monthly': '月次詳細'
    };
    
    // 詳細ページの場合はさらに深いパンくずを表示
    if (isDetail) {
      return [
        { path: `/monthly-report?tab=${tab}`, label: tabNames[tab] || tab },
        { path: `${pathname}`, label: '詳細表示' }
      ];
    }
    
    // タブが選択されている場合
    if (tab !== 'summary') {
      return [
        { path: `/monthly-report?tab=summary`, label: 'サマリー' },
        { path: `/monthly-report?tab=${tab}`, label: tabNames[tab] || tab }
      ];
    }
    
    return null;
  }
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  
  // パスからパンくずリストのセグメントを取得
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  
  // パスが空の場合はダッシュボード
  if (pathSegments.length === 0) {
    pathSegments.push('dashboard');
  }
  
  // 基本パスとサブパスを生成
  let breadcrumbs = [];
  
  // ホームリンク
  breadcrumbs.push({ path: '/', label: 'ホーム' });
  
  // 基本パスを追加
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    const path = `/${pathSegments.slice(0, i + 1).join('/')}`;
    const label = pathMap[segment] || segment;
    
    breadcrumbs.push({ path, label });
    
    // 最後のセグメントの場合、サブパスも確認
    if (i === pathSegments.length - 1) {
      const subPathGetter = subPathGetters[segment];
      if (subPathGetter) {
        const subPaths = subPathGetter(location.pathname, location.search);
        if (subPaths) {
          breadcrumbs = [...breadcrumbs, ...subPaths];
        }
      }
    }
  }
  
  return (
    <div className="breadcrumbs" style={{ 
      padding: '0.5rem 1rem', 
      background: '#f5f5f5', 
      borderRadius: '4px',
      marginBottom: '1rem'
    }}>
      {breadcrumbs.map((item, index) => (
        <span key={item.path}>
          {index > 0 && <span style={{ margin: '0 0.5rem' }}>&gt;</span>}
          {index === breadcrumbs.length - 1 ? (
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