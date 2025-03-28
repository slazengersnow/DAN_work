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

  return (
    <div className="employees-tab-container">
      <div className="data-container">
        <div className="data-header">
          <h3 className="data-title">従業員詳細</h3>
          <div className="header-actions">
            {editMode ? (
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
        <div className="data-table-wrapper horizontal-scroll-container">
          <table className="data-table employee-detail-table">
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
                <th>4月</th>
                <th>5月</th>
                <th>6月</th>
                <th>7月</th>
                <th>8月</th>
                <th>9月</th>
                <th>10月</th>
                <th>11月</th>
                <th>12月</th>
                <th>1月</th>
                <th>2月</th>
                <th>3月</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.no}</td>
                  <td>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.employee_id}
                        onChange={(e) => onEmployeeChange(employee.id, 'employee_id', e.target.value)}
                        className="editable-input"
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.employee_id
                    )}
                  </td>
                  <td>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.name}
                        onChange={(e) => onEmployeeChange(employee.id, 'name', e.target.value)}
                        className="editable-input"
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.name
                    )}
                  </td>
                  <td>
                    {editMode ? (
                      <select 
                        value={employee.disability_type || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'disability_type', e.target.value)}
                        className="editable-select"
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
                  <td>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.disability || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'disability', e.target.value)}
                        className="editable-input"
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.disability
                    )}
                  </td>
                  <td>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.grade || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'grade', e.target.value)}
                        className="editable-input"
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.grade
                    )}
                  </td>
                  <td>
                    {editMode ? (
                      <input 
                        type="date"
                        value={employee.hire_date.split('/').join('-')}
                        onChange={(e) => onEmployeeChange(employee.id, 'hire_date', e.target.value.split('-').join('/'))}
                        className="editable-input"
                        disabled={summaryData.status === '確定済'}
                      />
                    ) : (
                      employee.hire_date
                    )}
                  </td>
                  <td>
                    {editMode ? (
                      <select 
                        value={employee.status}
                        onChange={(e) => onEmployeeChange(employee.id, 'status', e.target.value)}
                        className="editable-select"
                        disabled={summaryData.status === '確定済'}
                      >
                        <option value="在籍">在籍</option>
                        <option value="休職">休職</option>
                        <option value="退職">退職</option>
                      </select>
                    ) : (
                      <span className="status-badge active">{employee.status}</span>
                    )}
                  </td>
                  {(employee.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                    <td key={`${employee.id}-month-${monthIndex}`}>
                      {editMode ? (
                        <select 
                          value={status}
                          onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                          className="editable-select"
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
                  <td>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.memo || ''}
                        onChange={(e) => onEmployeeChange(employee.id, 'memo', e.target.value)}
                        className="editable-input memo-input"
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