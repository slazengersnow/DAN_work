// pages/PaymentReport.tsx
import React, { useState, useEffect } from 'react';

// 既存のタブコンポーネントをインポート（同じディレクトリにあると仮定）
import MonthlyDataTab from './MonthlyDataTab';
import PaymentInfoTab from './PaymentInfoTab';
import HistoryTab from './HistoryTab';

const PaymentReport: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  
  // URLからタブを取得する関数
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('tab') || 'history';
  };
  
  // 現在のタブ状態
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  
  // URLが変わったときにタブを更新（ブラウザバックボタン対応）
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // タブ切り替え関数
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // URLを更新してもページ遷移はしない
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="page-container">
      <h1 className="page-title">納付金申告</h1>
      
      {/* 年度選択など */}
      
      {/* タブナビゲーション */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'monthly' ? 'active' : ''} 
          onClick={() => handleTabChange('monthly')}
        >
          月別データ
        </button>
        <button 
          className={activeTab === 'payment' ? 'active' : ''} 
          onClick={() => handleTabChange('payment')}
        >
          納付金情報
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => handleTabChange('history')}
        >
          申告履歴
        </button>
      </div>
      
      {/* 条件付きレンダリングでタブコンテンツを表示 */}
      <div className="tab-content">
        {activeTab === 'monthly' && <MonthlyDataTab fiscalYear={fiscalYear} />}
        {activeTab === 'payment' && <PaymentInfoTab fiscalYear={fiscalYear} />}
        {activeTab === 'history' && <HistoryTab fiscalYear={fiscalYear} />}
      </div>
      
      {/* 注意書き */}
    </div>
  );
};

export default PaymentReport;