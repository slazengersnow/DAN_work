// src/pages/MonthlyReport/EmployeesTab.tsx
import React, { useState, useEffect } from 'react';
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
  // 編集モード状態
  const [editMode, setEditMode] = useState(false);
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);
  
  // props変更時にローカルデータを更新
  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // フィールド更新ハンドラー
  const handleFieldChange = (id: number, field: string, value: string) => {
    console.log(`フィールド変更: id=${id}, field=${field}, value=${value}`); // デバッグ用
    setLocalEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, [field]: value } : emp
      )
    );
  };

  // 月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    console.log(`月次ステータス変更: id=${id}, month=${monthIndex}, value=${value}`); // デバッグ用
    setLocalEmployees(prev => 
      prev.map(emp => {
        if (emp.id === id) {
          const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(1))];
          newMonthlyStatus[monthIndex] = Number(value);
          return { ...emp, monthlyStatus: newMonthlyStatus };
        }
        return emp;
      })
    );
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    console.log('編集モード切り替え'); // デバッグ用
    if (editMode) {
      // 編集モードを終了する場合、ローカルデータを元に戻す
      setLocalEmployees(employees);
    }
    setEditMode(!editMode);
  };

  // 保存ボタンのハンドラー
  const handleSave = () => {
    console.log('保存ボタンクリック'); // デバッグ用
    
    // 変更をparentに通知
    localEmployees.forEach(emp => {
      const originalEmp = employees.find(e => e.id === emp.id);
      if (originalEmp) {
        // 各フィールドの変更を確認して通知
        ['employee_id', 'name', 'disability_type', 'disability', 'grade', 'hire_date', 'status', 'memo'].forEach(field => {
          if (originalEmp[field as keyof Employee] !== emp[field as keyof Employee]) {
            onEmployeeChange(emp.id, field, String(emp[field as keyof Employee] || ''));
          }
        });
        
        // 月次ステータスの変更を確認
        if (JSON.stringify(originalEmp.monthlyStatus) !== JSON.stringify(emp.monthlyStatus)) {
          onEmployeeChange(emp.id, 'monthlyStatus', JSON.stringify(emp.monthlyStatus));
        }
      }
    });
    
    alert('従業員データを保存しました');
    setEditMode(false);
  };

  // 確定済みかどうか
  const isConfirmed = summaryData.status === '確定済';
  
  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  return (
    <div className="employees-tab-container">
      <div className="data-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>従業員詳細</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => {
                console.log('編集ボタンがクリックされました');
                toggleEditMode();
              }}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              disabled={isConfirmed}
            >
              {editMode ? '編集中止' : '編集'}
            </button>
            
            {editMode && (
              <button 
                type="button"
                onClick={() => {
                  console.log('保存ボタンがクリックされました');
                  handleSave();
                }}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#3a66d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={isConfirmed}
              >
                保存
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
                {months.map((month, index) => (
                  <th key={`month-${index}`} style={{ padding: '8px', textAlign: 'center' }}>{month}</th>
                ))}
                <th style={{ padding: '8px', textAlign: 'left' }}>備考</th>
              </tr>
            </thead>
            <tbody>
              {localEmployees.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{employee.no}</td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={employee.employee_id}
                        onChange={(e) => handleFieldChange(employee.id, 'employee_id', e.target.value)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
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
                        onChange={(e) => handleFieldChange(employee.id, 'name', e.target.value)}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
                      />
                    ) : (
                      employee.name
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <select 
                        value={employee.disability_type || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'disability_type', e.target.value)}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
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
                        onChange={(e) => handleFieldChange(employee.id, 'disability', e.target.value)}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
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
                        onChange={(e) => handleFieldChange(employee.id, 'grade', e.target.value)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
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
                        onChange={(e) => handleFieldChange(employee.id, 'hire_date', e.target.value.split('-').join('/'))}
                        style={{ 
                          width: '120px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
                      />
                    ) : (
                      employee.hire_date
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editMode ? (
                      <select 
                        value={employee.status}
                        onChange={(e) => handleFieldChange(employee.id, 'status', e.target.value)}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
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
                          disabled={isConfirmed}
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
                        onChange={(e) => handleFieldChange(employee.id, 'memo', e.target.value)}
                        style={{ 
                          width: '150px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        disabled={isConfirmed}
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