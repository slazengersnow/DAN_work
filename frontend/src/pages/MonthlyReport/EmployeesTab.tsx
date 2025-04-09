// src/pages/MonthlyReport/EmployeesTab.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Employee, MonthlyTotal } from './types';
import { updateEmployeeData, handleApiError } from '../../api/reportApi';
import { YearMonthContext } from './YearMonthContext'; // YearMonthContextのインポート方法を変更
import { useYearMonth } from './YearMonthContext';  // カスタムフックを使用


interface EmployeesTabProps {
  employees: Employee[];
  onEmployeeChange: (id: number, field: string, value: string) => void;
  summaryData: MonthlyTotal;
  onRefreshData?: () => void; // データ更新後にリフレッシュを親コンポーネントに通知
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  onEmployeeChange,
  summaryData,
  onRefreshData
}) => {
  console.log('EmployeesTab.tsx loaded at:', new Date().toISOString());
  
  // 年月コンテキストから現在の年月を取得（カスタムフックを使用）
  const { fiscalYear, month } = useYearMonth();
  
  // 編集モード状態
  const [editMode, setEditMode] = useState(false);
  console.log("EmployeesTab コンポーネントがマウントされました。editMode初期値:", false);
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);
  
  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 編集中のセル
  const [activeCell, setActiveCell] = useState<{empId: number, monthIndex: number} | null>(null);
  
  // 入力参照
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
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
    
    // 値の検証 (0, 0.5, 1, 2のみ許可)
    const numValue = parseFloat(value);
    const validValues = [0, 0.5, 1, 2];
    
    if (value === "") {
      // 空の入力は許可（ユーザーが削除している場合）
      setLocalEmployees(prev => 
        prev.map(emp => {
          if (emp.id === id) {
            const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(1))];
            newMonthlyStatus[monthIndex] = 0; // 空の入力は0として扱う
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        })
      );
      setErrorMessage(null);
    } else if (!isNaN(numValue) && validValues.includes(numValue)) {
      // 有効な値の場合、状態を更新
      setLocalEmployees(prev => 
        prev.map(emp => {
          if (emp.id === id) {
            const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(1))];
            newMonthlyStatus[monthIndex] = numValue;
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        })
      );
      setErrorMessage(null);
    } else {
      // 無効な値の場合、エラーメッセージを表示
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
    }
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    console.log('編集モード切り替え'); // デバッグ用
    if (editMode) {
      // 編集モードを終了する場合、ローカルデータを元に戻す
      setLocalEmployees(employees);
      setErrorMessage(null);
    }
    setEditMode(!editMode);
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
    console.log('保存ボタンクリック'); // デバッグ用
    
    // 値の検証
    let hasError = false;
    
    // すべての月次ステータスをチェック
    localEmployees.forEach(emp => {
      const monthlyStatus = emp.monthlyStatus || Array(12).fill(1);
      monthlyStatus.forEach((status) => {
        const validValues = [0, 0.5, 1, 2];
        if (!validValues.includes(status)) {
          hasError = true;
        }
      });
    });
    
    if (hasError) {
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
      return;
    }

    setIsLoading(true);
    
    try {
      // 変更をAPIに送信
      for (const emp of localEmployees) {
        const originalEmp = employees.find(e => e.id === emp.id);
        if (originalEmp) {
          const changedFields: Record<string, string> = {};
          
          // 各フィールドの変更を確認
          ['employee_id', 'name', 'disability_type', 'disability', 'grade', 'hire_date', 'status', 'memo'].forEach(field => {
            if (originalEmp[field as keyof Employee] !== emp[field as keyof Employee]) {
              changedFields[field] = String(emp[field as keyof Employee] || '');
            }
          });
          
          // 月次ステータスの変更を確認
          if (JSON.stringify(originalEmp.monthlyStatus) !== JSON.stringify(emp.monthlyStatus)) {
            changedFields['monthlyStatus'] = JSON.stringify(emp.monthlyStatus);
          }
          
          // 変更があればAPIに送信
          if (Object.keys(changedFields).length > 0) {
            await updateEmployeeData(fiscalYear, month, emp.id, changedFields);
            
            // 親コンポーネントにも変更を通知（ローカル更新用）
            Object.entries(changedFields).forEach(([field, value]) => {
              onEmployeeChange(emp.id, field, value);
            });
          }
        }
      }
      
      setErrorMessage(null);
      setEditMode(false);
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
      
      alert('従業員データを保存しました');
    } catch (error) {
      console.error('従業員データ保存エラー:', error);
      setErrorMessage(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // セル編集の開始
  const handleCellFocus = (empId: number, monthIndex: number) => {
    setActiveCell({ empId, monthIndex });
  };

  // キーボード操作ハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, empId: number, monthIndex: number) => {
    const currentEmpIndex = localEmployees.findIndex(emp => emp.id === empId);
    
    // 矢印キーによるナビゲーション
    if (editMode && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      
      let nextEmpIndex = currentEmpIndex;
      let nextMonthIndex = monthIndex;
      
      if (e.key === 'ArrowUp' && currentEmpIndex > 0) {
        nextEmpIndex = currentEmpIndex - 1;
      } else if (e.key === 'ArrowDown' && currentEmpIndex < localEmployees.length - 1) {
        nextEmpIndex = currentEmpIndex + 1;
      } else if (e.key === 'ArrowLeft' && monthIndex > 0) {
        nextMonthIndex = monthIndex - 1;
      } else if (e.key === 'ArrowRight' && monthIndex < 11) {
        nextMonthIndex = monthIndex + 1;
      }
      
      if (nextEmpIndex !== currentEmpIndex || nextMonthIndex !== monthIndex) {
        const nextEmpId = localEmployees[nextEmpIndex].id;
        const inputKey = `input-${nextEmpId}-${nextMonthIndex}`;
        
        // フォーカスを次のセルに移動
        setTimeout(() => {
          const inputElement = inputRefs.current[inputKey];
          if (inputElement) {
            inputElement.focus();
            inputElement.select(); // テキストを選択状態にする
          }
        }, 0);
      }
    }
    
    // Enterキーでも次の行に移動
    if (editMode && e.key === 'Enter') {
      e.preventDefault();
      
      if (currentEmpIndex < localEmployees.length - 1) {
        const nextEmpId = localEmployees[currentEmpIndex + 1].id;
        const inputKey = `input-${nextEmpId}-${monthIndex}`;
        
        setTimeout(() => {
          const inputElement = inputRefs.current[inputKey];
          if (inputElement) {
            inputElement.focus();
            inputElement.select();
          }
        }, 0);
      }
    }
    
    // Tabキーで右に移動、Shift+Tabで左に移動
    if (editMode && e.key === 'Tab') {
      e.preventDefault();
      
      let nextEmpIndex = currentEmpIndex;
      let nextMonthIndex = monthIndex;
      
      if (e.shiftKey) {
        // 前のセルに移動
        if (monthIndex > 0) {
          nextMonthIndex = monthIndex - 1;
        } else if (currentEmpIndex > 0) {
          nextEmpIndex = currentEmpIndex - 1;
          nextMonthIndex = 11; // 前の行の最後のセルへ
        }
      } else {
        // 次のセルに移動
        if (monthIndex < 11) {
          nextMonthIndex = monthIndex + 1;
        } else if (currentEmpIndex < localEmployees.length - 1) {
          nextEmpIndex = currentEmpIndex + 1;
          nextMonthIndex = 0; // 次の行の最初のセルへ
        }
      }
      
      if (nextEmpIndex !== currentEmpIndex || nextMonthIndex !== monthIndex) {
        const nextEmpId = localEmployees[nextEmpIndex].id;
        const inputKey = `input-${nextEmpId}-${nextMonthIndex}`;
        
        setTimeout(() => {
          const inputElement = inputRefs.current[inputKey];
          if (inputElement) {
            inputElement.focus();
            inputElement.select();
          }
        }, 0);
      }
    }
  };

  // ステータスの取得（確定状態のチェック）
  const currentStatus = summaryData.status || '未確定';
  let isConfirmed = currentStatus === '確定済';
  console.log('元のisConfirmed:', isConfirmed);
  // 強制的にfalseに設定
  isConfirmed = false;
  
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
              id="editButtonEmployees"
              onClick={() => {
                // 直接状態を強制的に変更
                const newEditingState = !editMode;
                console.log(`編集状態を強制的に${newEditingState ? '有効' : '無効'}にします`);
                setEditMode(newEditingState);
                // デバッグ用の遅延処理
                setTimeout(() => {
                  console.log('現在の編集状態:', editMode);
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
              disabled={isLoading}
            >
              {editMode ? '編集中止' : '編集'}
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
                display: editMode ? 'block' : 'none' // これで条件表示
              }}
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
        
        {/* エラーメッセージ表示エリア */}
        {errorMessage && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {errorMessage}
          </div>
        )}
        
        {/* ローディングインジケーター */}
        {isLoading && (
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            データを処理中...
          </div>
        )}
        
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
                  {/* 月次ステータス入力欄 - 直接入力式に変更 */}
                  {(employee.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                    <td key={`${employee.id}-month-${monthIndex}`} style={{ 
                      padding: '4px', 
                      textAlign: 'center',
                      backgroundColor: activeCell?.empId === employee.id && activeCell?.monthIndex === monthIndex ? '#e9f2ff' : 'white'
                    }}>
                      {editMode ? (
                        <input 
                          ref={(el: HTMLInputElement | null) => {
                            inputRefs.current[`input-${employee.id}-${monthIndex}`] = el;
                          }}
                          type="text" 
                          value={status}
                          onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                          onFocus={() => handleCellFocus(employee.id, monthIndex)}
                          onKeyDown={(e) => handleKeyDown(e, employee.id, monthIndex)}
                          style={{ 
                            width: '40px',
                            padding: '2px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                        />
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
        
        {/* 入力方法のガイド表示 - 編集モード時のみ表示 */}
        {editMode && (
          <div style={{ marginTop: '15px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>月次入力の操作方法</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
              <li>入力できる値: 0, 0.5, 1, 2</li>
              <li>矢印キー: セル間の移動</li>
              <li>Tab: 右のセルへ移動、Shift+Tab: 左のセルへ移動</li>
              <li>Enter: 下のセルへ移動</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesTab;