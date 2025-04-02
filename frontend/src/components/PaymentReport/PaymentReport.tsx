//PaymentReport.tsx # メインコンポーネント

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthlyDataTab from './MonthlyDataTab';
import PaymentInfoTab from './PaymentInfoTab';
import HistoryTab from './HistoryTab';

const PaymentReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // URLからタブパラメータを取得（デフォルトは'history'）
  const tabFromUrl = queryParams.get('tab') || 'history';
  
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  
  // タブが変更されたらURLも更新
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, location.pathname, location.search, navigate]);
  
  // URLからタブパラメータが変更された場合、状態を更新
  useEffect(() => {
    const tabParam = queryParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search, activeTab, queryParams]);

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
      
      <div className="tab-navigation">
        <button 
          className={activeTab === 'monthly' ? 'active' : ''} 
          onClick={() => setActiveTab('monthly')}
        >
          月別データ
        </button>
        <button 
          className={activeTab === 'payment' ? 'active' : ''} 
          onClick={() => setActiveTab('payment')}
        >
          納付金情報
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          申告履歴
        </button>
      </div>
      
      {activeTab === 'monthly' && <MonthlyDataTab fiscalYear={fiscalYear} />}
      {activeTab === 'payment' && <PaymentInfoTab fiscalYear={fiscalYear} />}
      {activeTab === 'history' && <HistoryTab fiscalYear={fiscalYear} />}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        注意: このデータは毎月の障害者雇用状況に基づいて計算されています。年度末の確定値と異なる場合があります。
      </div>
    </div>
  );
};

export default PaymentReport;