import React, { useState, useEffect } from 'react';
import MonthlyDataTab from './MonthlyDataTab';
import PaymentInfoTab from './PaymentInfoTab';
import HistoryTab from './HistoryTab';

const PaymentReport: React.FC = () => {
  // URLから現在のタブを取得
  const getCurrentTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'history';
  };

  // 状態
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [activeTab, setActiveTab] = useState<string>(getCurrentTab());
  
  // URLが変わった時に状態を更新（ブラウザの戻る・進むボタン対応）
  useEffect(() => {
    const handleUrlChange = () => {
      setActiveTab(getCurrentTab());
    };
    
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">納付金申告</h1>
      
      <div className="period-selector">
        <span>対象年度</span>
        <select 
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          className="year-select"
        >
          <option value="2024年度">2024年度</option>
          <option value="2023年度">2023年度</option>
        </select>
        <button className="display-button">表示</button>
      </div>
      
      <div className="summary-box">
        <h2>障害者雇用納付金申告サマリー (2024年度)</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>ステータス</div>
            <div>対象期間 2024年4月～2025年3月</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              調整金額
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#28a745'
            }}>
              533,412円
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>(法定雇用率2.3%)</div>
          </div>
        </div>
      </div>
      
      {/* タブリンク - 通常のHTMLリンクとして実装 */}
      <div className="tab-navigation" style={{ display: 'flex', borderBottom: '1px solid #dee2e6' }}>
        <a 
          href="/payment-report?tab=monthly"
          className={`tab-link ${activeTab === 'monthly' ? 'active' : ''}`}
          style={{ 
            padding: '10px 15px', 
            textDecoration: 'none',
            color: activeTab === 'monthly' ? '#4285f4' : '#495057',
            borderBottom: activeTab === 'monthly' ? '2px solid #4285f4' : '2px solid transparent',
            fontWeight: activeTab === 'monthly' ? 'bold' : 'normal'
          }}
        >
          月別データ
        </a>
        <a 
          href="/payment-report?tab=payment"
          className={`tab-link ${activeTab === 'payment' ? 'active' : ''}`}
          style={{ 
            padding: '10px 15px', 
            textDecoration: 'none',
            color: activeTab === 'payment' ? '#4285f4' : '#495057',
            borderBottom: activeTab === 'payment' ? '2px solid #4285f4' : '2px solid transparent',
            fontWeight: activeTab === 'payment' ? 'bold' : 'normal'
          }}
        >
          納付金情報
        </a>
        <a 
          href="/payment-report?tab=history"
          className={`tab-link ${activeTab === 'history' ? 'active' : ''}`}
          style={{ 
            padding: '10px 15px', 
            textDecoration: 'none',
            color: activeTab === 'history' ? '#4285f4' : '#495057',
            borderBottom: activeTab === 'history' ? '2px solid #4285f4' : '2px solid transparent',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal'
          }}
        >
          申告履歴
        </a>
      </div>
      
      {/* タブコンテンツ */}
      <div className="tab-content">
        {activeTab === 'monthly' && <MonthlyDataTab key="monthly-tab" fiscalYear={fiscalYear} />}
        {activeTab === 'payment' && <PaymentInfoTab key="payment-tab" fiscalYear={fiscalYear} />}
        {activeTab === 'history' && <HistoryTab key="history-tab" fiscalYear={fiscalYear} />}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        注意: このデータは毎月の障害者雇用状況に基づいて計算されています。年度末の確定値と異なる場合があります。
      </div>
    </div>
  );
};

export default PaymentReport;