// src/pages/MonthlyReport/EmployeesTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Employee, MonthlyTotal } from './types';
import { 
  updateEmployeeData, 
  createEmployeeDetail,
  handleApiError 
} from '../../api/reportApi';
import { useYearMonth } from './YearMonthContext';

// 親コンポーネントから受け取る props の型定義（オプショナルプロパティを含む）
interface EmployeesTabProps {
  employees: Employee[];
  onEmployeeChange: (id: number, field: string, value: string) => void;
  summaryData: MonthlyTotal;
  onRefreshData?: () => void;
  // オプショナルプロパティとして再定義
  isEditing?: boolean;
  onToggleEditMode?: () => void;
  onSaveSuccess?: () => void;
  editingStyles?: React.CSSProperties;
  buttonStyles?: Record<string, React.CSSProperties>;
  // 年度変更用の追加プロパティ
  onYearChange?: (year: number) => void;
}

// 従業員データのデフォルト値
const defaultEmployee: Omit<Employee, 'id'> = {
  no: 0,
  employee_id: '',
  name: '',
  disability_type: '',
  disability: '',
  grade: '',
  hire_date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
  status: '在籍',
  monthlyStatus: Array(12).fill(1), // デフォルトは全ての月で1カウント
  memo: '',
  count: 0
};

// サンプルの従業員データ - デフォルト表示用
const sampleEmployees: Employee[] = [
  {
    id: 1,
    no: 1,
    employee_id: '1001',
    name: '山田 太郎',
    disability_type: '身体障害',
    disability: '視覚',
    grade: '1級',
    hire_date: '2020/04/01',
    status: '在籍',
    monthlyStatus: Array(12).fill(1),
    memo: '',
    count: 0
  },
  {
    id: 2,
    no: 2,
    employee_id: '2222',
    name: '鈴木 花子',
    disability_type: '身体障害',
    disability: '聴覚',
    grade: '4級',
    hire_date: '2020/04/01',
    status: '在籍',
    monthlyStatus: Array(12).fill(1),
    memo: '',
    count: 0
  },
  {
    id: 3,
    no: 3,
    employee_id: '3333',
    name: '佐藤 一郎',
    disability_type: '知的障害',
    disability: '',
    grade: 'B',
    hire_date: '2020/04/01',
    status: '在籍',
    monthlyStatus: Array(12).fill(1),
    memo: '',
    count: 0
  }
];

const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees = [], // デフォルト値を設定
  onEmployeeChange,
  summaryData = {}, // デフォルト値を設定
  onRefreshData,
  // デフォルト値を設定したオプショナルプロパティ
  isEditing = false,
  onToggleEditMode,
  onSaveSuccess = () => {},
  editingStyles = {},
  buttonStyles = {},
  onYearChange
}) => {
  console.log('EmployeesTab マウント - 受け取った従業員データ:', employees);
  
  // 年月コンテキストから現在の年月を取得
  const { fiscalYear, month, setFiscalYear } = useYearMonth();
  
  // 内部編集状態（親からisEditingが渡されない場合に使用）
  const [internalIsEditing, setInternalIsEditing] = useState<boolean>(false);
  
  // 実際に使用する編集状態（親から渡された場合はそれを使用、そうでなければ内部状態を使用）
  const actualIsEditing = isEditing !== undefined ? isEditing : internalIsEditing;
  
  // 新規作成関連の状態
  const [isCreating, setIsCreating] = useState(false); // 新規作成モード
  const [showForm, setShowForm] = useState(false); // フォーム表示状態
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({...defaultEmployee});
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  
  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 成功メッセージ状態
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 編集中のセル
  const [activeCell, setActiveCell] = useState<{empId: number, monthIndex: number} | null>(null);
  
  // 入力参照
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // props変更時にローカルデータを更新
  useEffect(() => {
    console.log('従業員データ更新:', employees);
    
    // 従業員データが空の場合にサンプルデータを使用する条件を修正
    // APIからのデータがある場合はそちらを優先
    if (employees && employees.length > 0) {
      setLocalEmployees(employees);
    } else {
      // APIデータがない場合はサンプルデータを表示
      setLocalEmployees(sampleEmployees);
    }
  }, [employees]);

  // 内部編集モード切り替えハンドラー（親からonToggleEditModeが渡されていない場合に使用）
  const handleToggleEditMode = () => {
    if (onToggleEditMode) {
      // 親から渡された関数を使用
      onToggleEditMode();
    } else {
      // 内部状態を更新
      if (internalIsEditing) {
        // 編集モードを終了する場合、ローカルデータを元に戻す
        if (employees && employees.length > 0) {
          setLocalEmployees(employees);
        } else {
          setLocalEmployees(sampleEmployees);
        }
        setErrorMessage(null);
        setShowForm(false);
        setIsCreating(false);
      }
      setInternalIsEditing(!internalIsEditing);
    }
  };

  // 年度変更ハンドラー
  const handleYearChange = (newYear: number) => {
    if (onYearChange) {
      onYearChange(newYear);
    } else if (setFiscalYear) {
      setFiscalYear(newYear);
    }
  };

  // フィールド更新ハンドラー
  const handleFieldChange = (id: number, field: string, value: string) => {
    setLocalEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, [field]: value } : emp
      )
    );
  };

  // 新規従業員フィールド更新ハンドラー
  const handleNewEmployeeChange = (field: keyof typeof defaultEmployee, value: string) => {
    setNewEmployee(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
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

  // 新規従業員の月次ステータス更新ハンドラー
  const handleNewEmployeeMonthlyStatusChange = (monthIndex: number, value: string) => {
    // 値の検証 (0, 0.5, 1, 2のみ許可)
    const numValue = parseFloat(value);
    const validValues = [0, 0.5, 1, 2];
    
    if (value === "" || (isNaN(numValue)) || !validValues.includes(numValue)) {
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
      return;
    }
    
    setNewEmployee(prev => {
      const newMonthlyStatus = [...(prev.monthlyStatus || Array(12).fill(1))];
      newMonthlyStatus[monthIndex] = numValue;
      return {
        ...prev,
        monthlyStatus: newMonthlyStatus
      };
    });
    setErrorMessage(null);
  };

  // 新規作成ボタンのハンドラー
  const handleCreateClick = () => {
    setShowForm(true);
    setIsCreating(true);
    setNewEmployee({...defaultEmployee, no: localEmployees.length + 1});
  };

  // キャンセルボタンのハンドラー
  const handleCancelCreate = () => {
    setShowForm(false);
    setIsCreating(false);
    setErrorMessage(null);
  };

  // 新規作成のハンドラー
  const handleCreate = async () => {
    // バリデーション
    if (!newEmployee.name) {
      setErrorMessage("名前は必須です");
      return;
    }
    
    if (!newEmployee.employee_id) {
      setErrorMessage("社員IDは必須です");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // API呼び出し
      console.log(`新規従業員データを作成します:`, newEmployee);
      const createdEmployee = await createEmployeeDetail(fiscalYear, month, newEmployee);
      console.log(`作成された従業員データ:`, createdEmployee);
      
      // ローカルデータに追加
      const newEmp = createdEmployee || {
        ...newEmployee,
        id: Math.max(...localEmployees.map(e => e.id || 0)) + 1
      };
      
      setLocalEmployees(prev => [...prev, newEmp]);
      
      // フォームをリセット
      setNewEmployee({...defaultEmployee, no: localEmployees.length + 2});
      setErrorMessage(null);
      
      // 作成完了メッセージ
      setSuccessMessage('従業員データを作成しました');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // フォームを閉じる
      setShowForm(false);
      setIsCreating(false);
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('従業員作成エラー:', error);
      setErrorMessage(handleApiError(error));
      
      // エラーが発生しても、UIにはデータを反映（オフライン対応）
      const tempId = Math.max(...localEmployees.map(e => e.id || 0)) + 999;
      const tempEmployee = {
        ...newEmployee, 
        id: tempId
      };
      
      setLocalEmployees(prev => [...prev, tempEmployee as Employee]);
      setSuccessMessage('従業員データをローカルに追加しました（APIエラーのため一時的）');
      
      // フォームを閉じる
      setShowForm(false);
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
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
      const originalEmployees = employees.length > 0 ? employees : sampleEmployees;
      
      for (const emp of localEmployees) {
        const originalEmp = originalEmployees.find(e => e.id === emp.id);
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
            // APIエラーをキャッチしても処理を続行
            try {
              await updateEmployeeData(fiscalYear, month, emp.id, changedFields);
              
              // 親コンポーネントにも変更を通知（ローカル更新用）
              Object.entries(changedFields).forEach(([field, value]) => {
                onEmployeeChange(emp.id, field, value);
              });
            } catch (error) {
              console.error(`従業員ID ${emp.id} の更新エラー:`, error);
              // エラーを表示するが処理は続行
              setErrorMessage(`従業員ID ${emp.id} の更新中にエラーが発生しましたが、他の変更の処理を続行します`);
            }
          }
        }
      }
      
      // 編集モード終了を親に通知
      onSaveSuccess();
      
      // 内部状態を更新（親からisEditingが渡されていない場合）
      if (isEditing === undefined) {
        setInternalIsEditing(false);
      }
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
      
      // 成功メッセージを表示
      setSuccessMessage('従業員データを保存しました');
      setTimeout(() => setSuccessMessage(null), 3000);
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
    if (actualIsEditing && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
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
    if (actualIsEditing && e.key === 'Enter') {
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
    if (actualIsEditing && e.key === 'Tab') {
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
  const currentStatus = summaryData?.status || '未確定';
  const isConfirmed = currentStatus === '確定済';
  
  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // デフォルトのボタンスタイル（親から渡されない場合に使用）
  const defaultButtonStyles = {
    primary: {
      padding: '8px 16px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    secondary: {
      padding: '8px 16px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    success: {
      padding: '8px 16px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  };

  // 実際に使用するボタンスタイル
  const actualButtonStyles = {
    primary: buttonStyles.primary || defaultButtonStyles.primary,
    secondary: buttonStyles.secondary || defaultButtonStyles.secondary,
    success: buttonStyles.success || defaultButtonStyles.success
  };

  // 年度選択リストを作成（現在の年から前後5年分）
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    yearOptions.push(year);
  }

  return (
    <div className="employees-tab-container">
      <div className="data-container">
        {/* 年度選択と従業員詳細ヘッダー */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          backgroundColor: '#f8f9fa',
          padding: '10px 15px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <div>
            <h3 style={{ margin: 0 }}>従業員詳細</h3>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
              {fiscalYear}年度のデータを表示しています
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* 年度選択ドロップダウン */}
            <div>
              <label style={{ marginRight: '8px', fontSize: '0.9rem' }}>年度:</label>
              <select
                value={fiscalYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '0.9rem'
                }}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}年度</option>
                ))}
              </select>
            </div>
            
            {/* 編集・新規作成ボタン群 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isCreating && (
                <button 
                  type="button"
                  id="editButtonEmployees"
                  onClick={handleToggleEditMode}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: actualIsEditing ? '#dc3545' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading || isConfirmed}
                >
                  {actualIsEditing ? '編集中止' : '編集'}
                </button>
              )}
              
              {actualIsEditing && !isCreating && (
                <button 
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              )}

              {!isCreating && (
                <button 
                  type="button"
                  onClick={handleCreateClick}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading || isConfirmed}
                >
                  新規追加
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 成功メッセージ表示エリア */}
        {successMessage && (
          <div style={{ 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {successMessage}
          </div>
        )}
        
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

        {/* 新規従業員追加フォーム */}
        {showForm && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0' }}>新規従業員追加</h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>社員ID*</label>
                <input 
                  type="text" 
                  value={newEmployee.employee_id}
                  onChange={(e) => handleNewEmployeeChange('employee_id', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>氏名*</label>
                <input 
                  type="text" 
                  value={newEmployee.name}
                  onChange={(e) => handleNewEmployeeChange('name', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>障害区分</label>
                <select 
                  value={newEmployee.disability_type}
                  onChange={(e) => handleNewEmployeeChange('disability_type', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">なし</option>
                  <option value="身体障害">身体障害</option>
                  <option value="知的障害">知的障害</option>
                  <option value="精神障害">精神障害</option>
                </select>
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>障害</label>
                <input 
                  type="text" 
                  value={newEmployee.disability}
                  onChange={(e) => handleNewEmployeeChange('disability', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>等級</label>
                <input 
                  type="text" 
                  value={newEmployee.grade}
                  onChange={(e) => handleNewEmployeeChange('grade', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>採用日</label>
                <input 
                  type="date" 
                  value={newEmployee.hire_date.split('/').join('-')}
                  onChange={(e) => handleNewEmployeeChange('hire_date', e.target.value.split('-').join('/'))}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>状態</label>
                <select 
                  value={newEmployee.status}
                  onChange={(e) => handleNewEmployeeChange('status', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="在籍">在籍</option>
                  <option value="休職">休職</option>
                  <option value="退職">退職</option>
                </select>
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>備考</label>
                <input 
                  type="text" 
                  value={newEmployee.memo || ''}
                  onChange={(e) => handleNewEmployeeChange('memo', e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>月次ステータス</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {months.map((month, index) => (
                  <div key={`new-monthly-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', marginBottom: '2px' }}>{month}</span>
                    <input 
                      type="text" 
                      value={(newEmployee.monthlyStatus || [])[index] || 1}
                      onChange={(e) => handleNewEmployeeMonthlyStatusChange(index, e.target.value)}
                      style={{ 
                        width: '40px',
                        padding: '5px',
                        textAlign: 'center',
                        border: '1px solid #ced4da',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#6c757d' }}>
                入力できる値: 0, 0.5, 1, 2
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={handleCancelCreate}
                style={actualButtonStyles.secondary}
              >
                キャンセル
              </button>
              
              <button 
                type="button"
                onClick={handleCreate}
                style={actualButtonStyles.success}
                disabled={isLoading}
              >
                {isLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        )}

        {/* テーブルコンテナ - 常に表示する */}
        <div style={{ 
          ...editingStyles,
          overflowX: 'auto',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #dee2e6',
          padding: '10px',
          marginBottom: '20px'
        }}>
          {/* 従業員データテーブル - 常に表示 */}
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px',
            whiteSpace: 'nowrap'
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
              {localEmployees.length > 0 ? (
                // 従業員データがある場合、テーブル行を表示
                localEmployees.map((employee, index) => (
                  <tr key={employee.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{employee.no || index + 1}</td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
                        <input 
                          type="text" 
                          value={employee.employee_id || ''}
                          onChange={(e) => handleFieldChange(employee.id, 'employee_id', e.target.value)}
                          style={{ 
                            width: '60px',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        employee.employee_id || '-'
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
                        <input 
                          type="text" 
                          value={employee.name || ''}
                          onChange={(e) => handleFieldChange(employee.id, 'name', e.target.value)}
                          style={{ 
                            width: '100px',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        employee.name || '-'
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
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
                        employee.disability_type || '-'
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
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
                        employee.disability || '-'
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
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
                        employee.grade || '-'
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
                        <input 
                          type="date"
                          value={(employee.hire_date || '').split('/').join('-')}
                          onChange={(e) => handleFieldChange(employee.id, 'hire_date', e.target.value.split('-').join('/'))}
                          style={{ 
                            width: '120px',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        employee.hire_date || '-'
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {actualIsEditing ? (
                        <select 
                          value={employee.status || '在籍'}
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
                          backgroundColor: 
                            employee.status === '在籍' ? '#4caf50' : 
                            employee.status === '休職' ? '#ff9800' : 
                            employee.status === '退職' ? '#f44336' : '#999',
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '12px' 
                        }}>
                          {employee.status || '不明'}
                        </span>
                      )}
                    </td>
                    {/* 月次ステータス入力欄 */}
                    {(employee.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                      <td key={`${employee.id}-month-${monthIndex}`} style={{ 
                        padding: '4px', 
                        textAlign: 'center',
                        backgroundColor: activeCell?.empId === employee.id && activeCell?.monthIndex === monthIndex ? '#e9f2ff' : 'white'
                      }}>
                        {actualIsEditing ? (
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
                      {actualIsEditing ? (
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
                        employee.memo || '-'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // 従業員データがない場合は、テーブル内に「データがありません」メッセージと追加ボタンを表示
                <tr>
                  <td colSpan={20} style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>従業員データがありません</p>
                    <button 
                      type="button"
                      onClick={handleCreateClick}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        margin: '0 auto'
                      }}
                    >
                      従業員追加
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 入力方法のガイド表示 - 編集モード時のみ表示 */}
        {actualIsEditing && localEmployees && localEmployees.length > 0 && !showForm && (
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