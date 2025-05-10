import React, { useState, useEffect } from 'react';
import { 
  shouldShowYearMonthControls, 
  getYearMonthControlStyle, 
  getYearMonthControlClass,
  setShowYearMonthControls
} from '../../api/yearMonthControlsHandler';
import { useYearMonth } from './YearMonthContext';

/**
 * 年度・月選択コントロールの表示/非表示設定をテストするためのコンポーネント
 * 
 * このコンポーネントは、サーバーサイドからの表示設定をテストするために使用します。
 * 実際の運用環境では使用しません。
 */
const YearMonthVisibilityTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(shouldShowYearMonthControls());
  const { fiscalYear, month } = useYearMonth();
  // コンテキストの代わりに直接ハンドラーから取得
  const canShowYearMonthControls = shouldShowYearMonthControls();
  
  // コンポーネントのマウント時に現在の設定を取得
  useEffect(() => {
    setIsVisible(shouldShowYearMonthControls());
  }, []);
  
  // 表示設定を手動で切り替える関数
  const toggleVisibility = () => {
    const newValue = !isVisible;
    setShowYearMonthControls(newValue);
    setIsVisible(newValue);
  };
  
  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ddd',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2>年度・月選択コントロール表示設定テスト</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>現在の表示設定:</strong> {isVisible ? '表示' : '非表示'}</p>
        <p><strong>コンテキストの表示設定:</strong> {canShowYearMonthControls ? '表示' : '非表示'}</p>
        <p><strong>現在の年度:</strong> {fiscalYear}</p>
        <p><strong>現在の月:</strong> {month}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={toggleVisibility}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3a66d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          表示設定を切り替え（現在: {isVisible ? '表示' : '非表示'}）
        </button>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>テスト用年度セレクタ</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <span>通常スタイル: </span>
          <select style={{ padding: '4px 8px' }}>
            <option>2023年度</option>
            <option>2024年度</option>
            <option>2025年度</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <span>制御スタイル適用: </span>
          <select style={{ 
            padding: '4px 8px',
            ...getYearMonthControlStyle()
          }}>
            <option>2023年度</option>
            <option>2024年度</option>
            <option>2025年度</option>
          </select>
        </div>
        
        <div>
          <span>制御クラス適用: </span>
          <select className={getYearMonthControlClass()} style={{ padding: '4px 8px' }}>
            <option>2023年度</option>
            <option>2024年度</option>
            <option>2025年度</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666' }}>
        <p>※このコンポーネントはテスト用です。実際の運用環境では使用しません。</p>
        <p>※実際の環境では、サーバーサイドからの設定によって表示/非表示が制御されます。</p>
      </div>
    </div>
  );
};

export default YearMonthVisibilityTest;