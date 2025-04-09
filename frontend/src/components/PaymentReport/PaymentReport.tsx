// src/components/PaymentReport/PaymentReport.tsx
import React, { useState, useEffect } from 'react';
import MonthlyDataTab from './MonthlyDataTab';
import PaymentInfoTab from './PaymentInfoTab';
import HistoryTab from './HistoryTab';

const PaymentReport: React.FC = () => {
  // 現在の年度を取得
  const currentYear = new Date().getFullYear();
  
  // 年度の選択肢を作成（現在の年度から5年前までを選択可能にする）
  const yearOptions = Array.from({ length: 6 }, (_, i) => `${currentYear - i}年度`);
  
  // デフォルト値を2024年度に設定（または存在するデータの年度に）
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  
  // URLからタブを取得する関数
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('tab') || 'monthly';
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

  // 年度変更ハンドラー
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiscalYear(e.target.value);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">納付金申告</h1>
      
      {/* 年度選択 */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '8px' }}>年度:</label>
        <select 
          value={fiscalYear} 
          onChange={handleYearChange}
          style={{ 
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #ced4da'
          }}
        >
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      
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
    </div>
  );
};

export default PaymentReport;