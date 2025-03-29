// frontend/src/pages/MonthlyReportDetail.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useQuery } from 'react-query';

interface MonthlyData {
  employeeCount: number[];
  fullTimeCount: number[];
  partTimeCount: number[];
  totalEmployeeCount: number[];
  level1And2Count: number[];
  otherDisabilityCount: number[];
  level1And2PartTimeCount: number[];
  otherDisabilityPartTimeCount: number[];
  totalDisabilityCount: number[];
  actualEmploymentRate: number[];
  legalEmploymentRate: number;
  legalEmployeeCount: number[];
  overOrUnder: number[];
}

const MonthlyReportDetail: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState<string>('2024年度');
  
  // 初期データ
  const initialData: MonthlyData = {
    employeeCount: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690],
    fullTimeCount: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690],
    partTimeCount: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    totalEmployeeCount: [600, 604, 633, 640, 650, 650, 660, 670, 665, 670, 680, 690],
    level1And2Count: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    otherDisabilityCount: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    level1And2PartTimeCount: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    otherDisabilityPartTimeCount: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    totalDisabilityCount: [4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    actualEmploymentRate: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    legalEmploymentRate: 2.3,
    legalEmployeeCount: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    overOrUnder: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  const [monthlyData, setMonthlyData] = useState<MonthlyData>(initialData);
  
  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // フォーム入力の変更処理
  const handleDataChange = (field: keyof MonthlyData, monthIndex: number, value: string): void => {
    const newData = { ...monthlyData };
    
    if (field === 'legalEmploymentRate') {
      newData[field] = parseFloat(value) || 0;
    } else if (Array.isArray(newData[field])) {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue)) {
        (newData[field] as number[])[monthIndex] = numValue;
      }
    }
    
    // 従業員数の合計を計算
    if (field === 'fullTimeCount' || field === 'partTimeCount') {
      newData.totalEmployeeCount[monthIndex] = 
        newData.fullTimeCount[monthIndex] + newData.partTimeCount[monthIndex];
    }
    
    // 障害者数の合計を計算
    if (field === 'level1And2Count' || field === 'otherDisabilityCount' ||
        field === 'level1And2PartTimeCount' || field === 'otherDisabilityPartTimeCount') {
      newData.totalDisabilityCount[monthIndex] = 
        newData.level1And2Count[monthIndex] + 
        newData.otherDisabilityCount[monthIndex] + 
        newData.level1And2PartTimeCount[monthIndex] + 
        newData.otherDisabilityPartTimeCount[monthIndex];
    }
    
    setMonthlyData(newData);
  };

  // 実雇用率、法定雇用者数、超過・未達を自動計算
  useEffect(() => {
    const newData = { ...monthlyData };
    
    for (let i = 0; i < 12; i++) {
      // 実雇用率を計算 (トータル障がい者数 / トータル従業員数)
      if (newData.totalEmployeeCount[i] > 0) {
        newData.actualEmploymentRate[i] = Number((newData.totalDisabilityCount[i] / newData.totalEmployeeCount[i] * 100).toFixed(2));
      } else {
        newData.actualEmploymentRate[i] = 0;
      }
      
      // 法定雇用者数を計算 (法定雇用率 * トータル従業員数 / 100)
      newData.legalEmployeeCount[i] = Math.floor(newData.legalEmploymentRate * newData.totalEmployeeCount[i] / 100);
      
      // 超過・未達を計算 (トータル障がい者数 - 法定雇用者数)
      newData.overOrUnder[i] = newData.totalDisabilityCount[i] - newData.legalEmployeeCount[i];
    }
    
    setMonthlyData(newData);
  }, [
    monthlyData.totalEmployeeCount,
    monthlyData.totalDisabilityCount,
    monthlyData.legalEmploymentRate
  ]);

  // CSVファイルをエクスポートする関数
  const exportToCSV = (): void => {
    alert('CSVエクスポート機能はまだ実装されていません');
  };

  // 印刷機能
  const handlePrint = (): void => {
    window.print();
  };

  // 共通のテーブルセルスタイル
  const cellStyle = {
    width: '100%',
    height: '24px',
    border: 'none',
    textAlign: 'center' as const,
    background: 'transparent',
    fontSize: '13px'
  };

  // 読み取り専用セルのスタイル
  const readonlyCellStyle = {
    ...cellStyle,
    backgroundColor: '#f8f9fa'
  };

  return (
    <div className="monthly-report-detail" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>月次報告</h1>
      
      {/* 集計サマリー */}
      <div style={{ 
        backgroundColor: '#f0f8ff', 
        padding: '15px', 
        borderRadius: '4px', 
        marginBottom: '20px' 
      }}>
        <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '10px' }}>{fiscalYear}集計サマリー</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <span>常用労働者数: 525名</span>
          <span>|</span>
          <span>障害者数: 5名</span>
          <span>|</span>
          <span>雇用カウント: 12.75</span>
          <span>|</span>
          <span>実雇用率: 2.43%</span>
          <span>|</span>
          <span>法定雇用率: {monthlyData.legalEmploymentRate}%</span>
        </div>
      </div>
      
      {/* タブナビゲーション */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #dee2e6', 
        marginBottom: '20px' 
      }}>
        <button style={{ 
          padding: '10px 20px',
          background: 'none',
          border: 'none',
          borderBottom: '2px solid transparent',
          cursor: 'pointer'
        }}>
          サマリー
        </button>
        <button style={{ 
          padding: '10px 20px',
          background: 'none',
          border: 'none',
          borderBottom: '2px solid transparent',
          cursor: 'pointer'
        }}>
          従業員詳細
        </button>
        <button style={{ 
          padding: '10px 20px',
          background: 'none',
          border: 'none',
          borderBottom: '2px solid #007bff',
          color: '#007bff',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          月次詳細
        </button>
      </div>
      
      {/* 月次詳細テーブル */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px',
        overflow: 'auto'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{ height: '32px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: '#f8f9fa', 
                zIndex: 1,
                width: '180px'
              }}></th>
              {months.map((month, index) => (
                <th key={`month-${index}`} style={{ padding: '4px', textAlign: 'center', fontWeight: 'normal' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 従業員数 - セクションヘッダー */}
            <tr>
              <td colSpan={13} style={{ 
                textAlign: 'left', 
                padding: '8px', 
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                borderBottom: '1px solid #dee2e6'
              }}>
                従業員数
              </td>
            </tr>
            
            {/* 従業員数行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                従業員数
              </td>
              {monthlyData.employeeCount.map((count, index) => (
                <td key={`emp-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('employeeCount', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* フルタイム従業員数行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                フルタイム従業員数
              </td>
              {monthlyData.fullTimeCount.map((count, index) => (
                <td key={`ft-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('fullTimeCount', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* パートタイム従業員数行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                パートタイム従業員数
              </td>
              {monthlyData.partTimeCount.map((count, index) => (
                <td key={`pt-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('partTimeCount', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* トータル従業員数行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                トータル従業員数
              </td>
              {monthlyData.totalEmployeeCount.map((count, index) => (
                <td key={`total-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={readonlyCellStyle}
                    value={count}
                    readOnly
                  />
                </td>
              ))}
            </tr>
            
            {/* 障がい者 - セクションヘッダー */}
            <tr>
              <td colSpan={13} style={{ 
                textAlign: 'left', 
                padding: '8px', 
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                borderBottom: '1px solid #dee2e6'
              }}>
                障がい者
              </td>
            </tr>
            
            {/* Level 1 & 2行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                Level 1 & 2
              </td>
              {monthlyData.level1And2Count.map((count, index) => (
                <td key={`l12-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('level1And2Count', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* その他行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                その他
              </td>
              {monthlyData.otherDisabilityCount.map((count, index) => (
                <td key={`other-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('otherDisabilityCount', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* Level 1 & 2 (パートタイム)行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                Level 1 & 2 (パートタイム)
              </td>
              {monthlyData.level1And2PartTimeCount.map((count, index) => (
                <td key={`l12pt-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('level1And2PartTimeCount', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* その他 (パートタイム)行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                その他 (パートタイム)
              </td>
              {monthlyData.otherDisabilityPartTimeCount.map((count, index) => (
                <td key={`otherpt-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={cellStyle}
                    value={count}
                    onChange={(e) => handleDataChange('otherDisabilityPartTimeCount', index, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            
            {/* トータル障がい者数行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                トータル障がい者数
              </td>
              {monthlyData.totalDisabilityCount.map((count, index) => (
                <td key={`totaldis-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={readonlyCellStyle}
                    value={count}
                    readOnly
                  />
                </td>
              ))}
            </tr>
            
            {/* 雇用率 - セクションヘッダー */}
            <tr>
              <td colSpan={13} style={{ 
                textAlign: 'left', 
                padding: '8px', 
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                borderBottom: '1px solid #dee2e6'
              }}>
                雇用率
              </td>
            </tr>
            
            {/* 実雇用率行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                実雇用率
              </td>
              {monthlyData.actualEmploymentRate.map((rate, index) => (
                <td key={`actual-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={readonlyCellStyle}
                    value={`${rate}%`}
                    readOnly
                  />
                </td>
              ))}
            </tr>
            
            {/* 法定雇用率行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                法定雇用率
              </td>
              <td colSpan={12} style={{ padding: '0', textAlign: 'left' }}>
                <input
                  type="text"
                  style={{
                    ...cellStyle,
                    width: '50px',
                    textAlign: 'right',
                    marginLeft: '8px'
                  }}
                  value={monthlyData.legalEmploymentRate}
                  onChange={(e) => handleDataChange('legalEmploymentRate', 0, e.target.value)}
                />
                <span>%</span>
              </td>
            </tr>
            
            {/* 法定雇用者数行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                法定雇用者数
              </td>
              {monthlyData.legalEmployeeCount.map((count, index) => (
                <td key={`legal-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={readonlyCellStyle}
                    value={count}
                    readOnly
                  />
                </td>
              ))}
            </tr>
            
            {/* 超過・未達行 */}
            <tr style={{ height: '24px' }}>
              <td style={{ 
                textAlign: 'left', 
                padding: '0 8px', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'white', 
                zIndex: 1,
                borderRight: '1px solid #f0f0f0'
              }}>
                超過・未達
              </td>
              {monthlyData.overOrUnder.map((value, index) => (
                <td key={`over-${index}`} style={{ padding: '0', textAlign: 'center' }}>
                  <input
                    type="text"
                    style={{
                      ...readonlyCellStyle,
                      color: value >= 0 ? '#28a745' : '#dc3545'
                    }}
                    value={value >= 0 ? `+${value}` : value}
                    readOnly
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* アクションボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          印刷
        </button>
        <button
          onClick={exportToCSV}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          CSVエクスポート
        </button>
      </div>
    </div>
  );
};

export default MonthlyReportDetail;