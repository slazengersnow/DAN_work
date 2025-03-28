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

  return (
    <div className="summary-tab-container">
      <div className="data-container">
        <div className="data-header">
          <h3 className="data-title">障害者雇用者詳細</h3>
          <div className="header-actions">
            {editingSummary ? (
              <button 
                className="btn primary-btn" 
                onClick={toggleEditMode}
                disabled={summaryData.status === '確定済'}
              >
                保存
              </button>
            ) : (
              <button 
                className="btn action-btn" 
                onClick={toggleEditMode}
                disabled={summaryData.status === '確定済'}
              >
                編集
              </button>
            )}
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>社員ID</th>
                <th>氏名</th>
                <th>障害区分</th>
                <th>障害</th>
                <th>等級</th>
                <th>採用日</th>
                <th>状態</th>
                <th>カウント</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.no}</td>
                  <td>{employee.employee_id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.disability_type}</td>
                  <td>{employee.disability}</td>
                  <td>{employee.grade}</td>
                  <td>{employee.hire_date}</td>
                  <td>
                    <span className="status-badge active">{employee.status}</span>
                  </td>
                  <td>
                    {editingSummary ? (
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="2" 
                        value={employee.count} 
                        onChange={(e) => handleCountChange(employee.id, e.target.value)}
                        className="editable-input small-input"
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.count
                    )}
                  </td>
                  <td>
                    {editingSummary ? (
                      <input 
                        type="text" 
                        value={employee.memo || ''} 
                        onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                        className="editable-input"
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
      
      <div className="data-container">
        <h3 className="data-title">月別実績履歴</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>年月</th>
                <th>常用労働者数</th>
                <th>障害者数</th>
                <th>身体障害</th>
                <th>知的障害</th>
                <th>精神障害</th>
                <th>雇用カウント</th>
                <th>実雇用率</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((record, index) => (
                <tr key={index}>
                  <td>{record.yearMonth}</td>
                  <td>{record.totalEmployees}</td>
                  <td>{record.disabledCount}</td>
                  <td>{record.physical}</td>
                  <td>{record.intellectual}</td>
                  <td>{record.mental}</td>
                  <td>{record.employmentCount}</td>
                  <td>{record.actualRate}%</td>
                  <td>
                    <span className="status-badge confirmed">{record.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;