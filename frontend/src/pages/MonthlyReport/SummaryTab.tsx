// src/pages/MonthlyReport/SummaryTab.tsx
import React, { useState } from 'react';
import { Employee, HistoryItem, MonthlyTotal } from './types';

interface SummaryTabProps {
  employees: Employee[];
  historyData: HistoryItem[];
  onEmployeeChange: (id: number, field: string, value: string) => void;
  summaryData: MonthlyTotal;
}

const SummaryTab: React.FC<SummaryTabProps> = ({
  employees,
  historyData,
  onEmployeeChange,
  summaryData
}) => {
  const [editingSummary, setEditingSummary] = useState(false);

  // カウント更新ハンドラー
  const handleCountChange = (id: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onEmployeeChange(id, 'count', numValue.toString());
    }
  };

  // メモ更新ハンドラー
  const handleMemoChange = (id: number, value: string) => {
    onEmployeeChange(id, 'memo', value);
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    setEditingSummary(!editingSummary);
  };

  // 保存ボタンのハンドラー（実際の実装では保存APIを呼び出す）
  const handleSave = () => {
    console.log('データを保存しました');
    setEditingSummary(false);
  };

  return (
    <div className="summary-tab-container">
      <div className="data-container">
        <div className="data-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="data-title" style={{ margin: 0 }}>障害者雇用者詳細</h3>
          <div className="header-actions">
            {editingSummary ? (
              <button 
                onClick={handleSave}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#3a66d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={summaryData.status === '確定済'}
              >
                保存
              </button>
            ) : (
              <button 
                onClick={toggleEditMode}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={summaryData.status === '確定済'}
              >
                編集
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>No.</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>社員ID</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>氏名</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>障害区分</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>障害</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>等級</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>採用日</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>状態</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>カウント</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>備考</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 12px' }}>{employee.no}</td>
                  <td style={{ padding: '8px 12px' }}>{employee.employee_id}</td>
                  <td style={{ padding: '8px 12px' }}>{employee.name}</td>
                  <td style={{ padding: '8px 12px' }}>{employee.disability_type}</td>
                  <td style={{ padding: '8px 12px' }}>{employee.disability}</td>
                  <td style={{ padding: '8px 12px' }}>{employee.grade}</td>
                  <td style={{ padding: '8px 12px' }}>{employee.hire_date}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ 
                      backgroundColor: '#4caf50', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {employee.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {editingSummary ? (
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="2" 
                        value={employee.count} 
                        onChange={(e) => handleCountChange(employee.id, e.target.value)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.count
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {editingSummary ? (
                      <input 
                        type="text" 
                        value={employee.memo || ''} 
                        onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                        style={{ 
                          width: '100%',
                          minWidth: '150px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.memo
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 月別実績履歴を非表示に設定 */}
    </div>
  );
};

export default SummaryTab;