import React, { useState, useEffect, useRef } from 'react';
import MonthlyDataTab from './MonthlyDataTab';
import PaymentInfoTab from './PaymentInfoTab';
import HistoryTab from './HistoryTab';
import { paymentReportApi } from '../../api/paymentReportApi';

const PaymentReport: React.FC = () => {
  // 現在の年度を取得
  const currentYear = new Date().getFullYear();
  
  // 年度の選択肢を作成（現在の年度から5年前までを選択可能にする）
  const yearOptions = Array.from({ length: 6 }, (_, i) => `${currentYear - i}年度`);
  
  // デフォルト値を現在の年度に設定
  const [fiscalYear, setFiscalYear] = useState<string>(`${currentYear}年度`);
  
  // データ状態
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // selectボックスのrefを作成
  const selectRef = useRef<HTMLSelectElement>(null);
  
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
  
  // 初回レンダリング時にセッションストレージから年度を復元
  useEffect(() => {
    // セッションストレージから前回選択した年度を取得
    const savedYear = sessionStorage.getItem('selectedFiscalYear');
    
    if (savedYear) {
      console.log(`前回選択した年度(${savedYear})を使用します`);
      setFiscalYear(savedYear);
      // この時点でデータ取得はまだ行わない
    }
  }, []);

  // fiscalYear が変更されたときにデータを取得する
  useEffect(() => {
    console.log(`年度(${fiscalYear})のデータを取得します`);
    fetchPaymentReportData(fiscalYear);
  }, [fiscalYear]);
  
  // データ取得関数
  const fetchPaymentReportData = async (year: string) => {
    try {
      setLoading(true);
      setError(null); // エラー状態をリセット
      setReportData(null); // データも一旦リセット
      
      // 年度からyear部分だけを抽出（例：「2024年度」→「2024」）
      const yearNum = parseInt(year.replace('年度', ''));
      console.log(`年度 ${yearNum} のデータを取得中...`);
      
      try {
        const data = await paymentReportApi.getPaymentReport(yearNum);
        
        // データ構造の詳細なログ
        console.log(`年度 ${yearNum} のデータ構造:`, {
          hasMonthlyData: !!data.monthly_data,
          monthlyDataType: typeof data.monthly_data,
          dataKeys: Object.keys(data)
        });
        
        // データを更新
        setReportData(data);
        console.log(`年度 ${yearNum} のデータを取得完了:`, data);
        setLoading(false);
        
      } catch (apiError) {
        console.error(`年度 ${yearNum} のデータ取得エラー:`, apiError);
        
        // レポートデータが存在しない場合はnullに設定
        setReportData(null);
        
        // ユーザーフレンドリーなエラーメッセージ
        setError(`${yearNum}年度のデータが見つかりません。「納付金情報」タブで新規作成してください。`);
        setLoading(false);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      setError('データの取得に失敗しました');
      setLoading(false);
      // データ取得に失敗した場合は、reportDataをnullに設定
      setReportData(null);
    }
  };
  
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
    const newYear = e.target.value;
    console.log(`年度切り替え: ${fiscalYear} → ${newYear}`);
    
    // 選択した年度をセッションストレージに保存
    sessionStorage.setItem('selectedFiscalYear', newYear);
    
    // データをリセット（新しいデータが取得されるまで古いデータを表示しない）
    setReportData(null);
    setError(null);
    
    // 状態を更新（これにより上記の useEffect が発動しデータを再取得）
    setFiscalYear(newYear);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">納付金申告</h1>
      
      {/* 年度選択 */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <label style={{ marginRight: '8px' }}>年度:</label>
        <select 
          ref={selectRef}
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
        
        {loading && <span style={{ marginLeft: '10px', color: '#666' }}>データを読み込み中...</span>}
        {error && <span style={{ marginLeft: '10px', color: 'red' }}>{error}</span>}
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
        {activeTab === 'monthly' && <MonthlyDataTab fiscalYear={fiscalYear} reportData={reportData} />}
        {activeTab === 'payment' && <PaymentInfoTab fiscalYear={fiscalYear} reportData={reportData} />}
        {activeTab === 'history' && <HistoryTab fiscalYear={fiscalYear} reportData={reportData} />}
      </div>
    </div>
  );
};

export default PaymentReport;