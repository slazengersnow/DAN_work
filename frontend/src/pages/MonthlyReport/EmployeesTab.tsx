// src/pages/MonthlyReport/EmployeesTab.tsx
import React, { useState } from 'react';
import { Employee, MonthlyTotal } from './types';

interface EmployeesTabProps {
  employees: Employee[];
  onEmployeeChange: (id: number, field: string, value: string) => void;
  summaryData: MonthlyTotal;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  onEmployeeChange,
  summaryData
}) => {
  const [editMode, setEditMode] = useState(false);

  // 月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    const currentEmployee = employees.find(emp => emp.id === id);
    if (currentEmployee) {
      const newMonthlyStatus = [...(currentEmployee.monthlyStatus || [])];
      newMonthlyStatus[monthIndex] = Number(value);
      onEmployeeChange(id, 'monthlyStatus', JSON.stringify(newMonthlyStatus));
    }
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // 保存ボタンのハンドラー（実際の実装では保存APIを呼び出す）
  const handleSave = () => {
    console.log('従業員データを保存しました');
    setEditMode(false);
  };

  return (
    <div className="employees-tab-container">
      <div className="data-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>従業員詳細</h3>
          <div>
            {editMode ? (
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
        
        {/* 横スクロール可能なテーブルコンテナ */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px',
            whiteSpace: 'nowrap'  // テーブルが横スクロールするように
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>No.</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>社員ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>氏名</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>障害区分</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>障害</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>等級</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>採用日</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>状態</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>4月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>5月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>6月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>7月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>8月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>9月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>10月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>11月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>12月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>1月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>2月</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>3月</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>備考</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{employee.no}</td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.employee_id}
                        onChange={(e) => onEmployeeChange(employee.id, 'employee_id', e.target.value)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.employee_id
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.name}
                        onChange={(e) => onEmployeeChange(employee.id, 'name', e.target.value)}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.name
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <select 
                        value={employee.disability_type || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'disability_type', e.target.value)}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      >
                        <option value="">なし</option>
                        <option value="身体障害">身体障害</option>
                        <option value="知的障害">知的障害</option>
                        <option value="精神障害">精神障害</option>
                      </select>
                    ) : (
                      employee.disability_type
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.disability || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'disability', e.target.value)}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.disability
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.grade || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'grade', e.target.value)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.grade
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="date"
                        value={employee.hire_date.split('/').join('-')}
                        onChange={(e) => onEmployeeChange(employee.id, 'hire_date', e.target.value.split('-').join('/'))}
                        style={{ 
                          width: '120px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.hire_date
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <select 
                        value={employee.status}
                        onChange={(e) => onEmployeeChange(employee.id, 'status', e.target.value)}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={summaryData.status === '確定済'}
                      >
                        <option value="在籍">在籍</option>
                        <option value="休職">休職</option>
                        <option value="退職">退職</option>
                      </select>
                    ) : (
                      <span style={{ 
                        backgroundColor: '#4caf50', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        {employee.status}
                      </span>
                    )}
                  </td>
                  {(employee.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                    <td key={`${employee.id}-month-${monthIndex}`} style={{ padding: '4px', textAlign: 'center' }}>
                      {editMode ? (
                        <select 
                          value={status}
                          onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                          style={{ 
                            width: '45px',
                            padding: '2px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                          disabled={summaryData.status === '確定済'}
                        >
                          <option value="0">0</option>
                          <option value="0.5">0.5</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                      ) : (
                        status
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.memo || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'memo', e.target.value)}
                        style={{ 
                          width: '150px',
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
    </div>
  );
};

export default EmployeesTab;