// src/pages/MonthlyReport/SummaryTab.tsx
import React, { useState, useEffect } from 'react';
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
  console.log('SummaryTab.tsx loaded at:', new Date().toISOString());
  
  // 編集モード状態
  const [editingSummary, setEditingSummary] = useState(false);
  console.log("SummaryTab コンポーネントがマウントされました。editingSummary初期値:", false);
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);
  
  // props変更時にローカルデータを更新
  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // カウント更新ハンドラー
  const handleCountChange = (id: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocalEmployees(prev => 
        prev.map(emp => 
          emp.id === id ? { ...emp, count: numValue } : emp
        )
      );
    }
  };

  // メモ更新ハンドラー
  const handleMemoChange = (id: number, value: string) => {
    setLocalEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, memo: value } : emp
      )
    );
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    console.log('編集モード切り替え'); // デバッグ用
    if (editingSummary) {
      // 編集モードを終了する場合、ローカルデータを元に戻す
      setLocalEmployees(employees);
    }
    setEditingSummary(!editingSummary);
  };

  // 保存ボタンのハンドラー
  const handleSave = () => {
    console.log('保存ボタンクリック'); // デバッグ用
    
    // 変更をparentに通知
    localEmployees.forEach(emp => {
      const originalEmp = employees.find(e => e.id === emp.id);
      if (originalEmp) {
        if (originalEmp.count !== emp.count) {
          onEmployeeChange(emp.id, 'count', emp.count.toString());
        }
        if (originalEmp.memo !== emp.memo) {
          onEmployeeChange(emp.id, 'memo', emp.memo || '');
        }
      }
    });
    
    alert('データを保存しました');
    setEditingSummary(false);
  };

  // ステータスの取得（確定状態のチェック）
  const currentStatus = summaryData.status || '未確定';
  let isConfirmed = currentStatus === '確定済';
  console.log('元のisConfirmed:', isConfirmed);
  // 強制的にfalseに設定
  isConfirmed = false;

  return (
    <div className="summary-tab-container">
      <div className="data-container">
        <div className="data-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="data-title" style={{ margin: 0 }}>障害者雇用者詳細</h3>
          <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              id="editButtonSummary"
              onClick={() => {
                // 直接状態を強制的に変更
                const newEditingState = !editingSummary;
                console.log(`編集状態を強制的に${newEditingState ? '有効' : '無効'}にします`);
                setEditingSummary(newEditingState);
                setTimeout(() => {
                  console.log('現在の編集状態:', editingSummary);
                }, 100);
              }}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {editingSummary ? '編集中止' : '編集'}
            </button>
            
            {/* 強制的に保存ボタンを表示 */}
            <button 
              type="button"
              onClick={handleSave}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#3a66d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: editingSummary ? 'block' : 'none' // これで条件表示
              }}
            >
              保存
            </button>
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
              {localEmployees.map((employee) => (
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
      
      {/* 月別実績履歴セクション - 必要に応じて表示 */}
      {historyData.length > 0 && (
        <div className="history-container" style={{ marginTop: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>月別実績履歴</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>月</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>雇用数</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>雇用率</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 12px' }}>{item.month}</td>
                  <td style={{ padding: '8px 12px' }}>{item.count}</td>
                  <td style={{ padding: '8px 12px' }}>{item.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SummaryTab;