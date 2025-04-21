// src/pages/MonthlyReport/EmployeesTab.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Employee, MonthlyTotal } from './types';
import { updateEmployeeData, handleApiError } from '../../api/reportApi';
import { YearMonthContext } from './YearMonthContext'; // YearMonthContextのインポート方法を変更
import { useYearMonth } from './YearMonthContext';  // カスタムフックを使用
import { 
  headerStyle, 
  buttonStyle, 
  primaryButtonStyle, 
  editModeIndicatorStyle, 
  buttonAreaStyle,
  errorMessageStyle,
  loadingIndicatorStyle,
  noDataMessageStyle,
  summaryBoxStyle,
  tableContainerStyle,
  tableStyle,
  tableHeaderStyle,
  tableCellStyle,
  statusBadgeStyle,
  sectionHeaderStyle,
  actionBarStyle,
  negativeValueStyle
} from './utils';


interface EmployeesTabProps {
  employees: Employee[];
  onEmployeeChange: (id: number, field: string, value: string) => void;
  summaryData: MonthlyTotal;
  onRefreshData?: () => void; // データ更新後にリフレッシュを親コンポーネントに通知
  isEmbedded?: boolean; // 埋め込みモード判定用
  onDetailCellChange?: (data: any) => void; // 埋め込みモード用のデータ変更通知関数
  initialEditMode?: boolean; // 初期編集モード
  isEditMode: boolean; // 親からの編集モード
  setIsEditMode: (mode: boolean) => void; // 親の編集モード設定関数
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  onEmployeeChange,
  summaryData,
  onRefreshData,
  isEmbedded = false, // デフォルト値を設定
  onDetailCellChange,
  initialEditMode = false, // 初期編集モードのデフォルト値
  isEditMode,
  setIsEditMode
}) => {
  console.log('EmployeesTab.tsx loaded at:', new Date().toISOString());
  
  // 年月コンテキストから現在の年月を取得（カスタムフックを使用）
  const { fiscalYear: year, month } = useYearMonth();
  
  // 編集モード状態
  const [editMode, setEditMode] = useState(false);
  console.log("EmployeesTab コンポーネントがマウントされました。editMode初期値:", false);
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);
  const [localData, setLocalData] = useState<any>(employees); // 埋め込みモードとの互換性のため
  
  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 編集状態の追加（埋め込みモードとの互換性のため）
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 編集中のセル
  const [activeCell, setActiveCell] = useState<{empId: number, monthIndex: number} | null>(null);
  
  // 入力参照
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // props変更時にローカルデータを更新
  useEffect(() => {
    console.log('props変更時のuseEffect 開始:', { employeesLength: employees.length });
    setLocalEmployees(employees);
    setLocalData(employees); // 埋め込みモードとの互換性のため
    console.log('props変更時のuseEffect 完了:', { localEmployeesLength: employees.length });
  }, [employees]);
  
  // 初期編集モード設定
  useEffect(() => {
    console.log('initialEditMode useEffect 開始:', { initialEditMode });
    // props から initialEditMode をチェック
    if (initialEditMode) {
      setIsEditMode(true);
      setIsEditing(true); // 埋め込みモードとの互換性のため
      console.log('新規データのため自動的に編集モードを有効化');
    }
    console.log('initialEditMode useEffect 完了:', { editMode: initialEditMode });
  }, [initialEditMode, setIsEditMode]);
  
  // コンポーネントマウント時のログと状態チェック
  useEffect(() => {
    console.log('コンポーネントマウント時の状態:', {
      editMode: isEditMode,
      データの長さ: localEmployees.length
    });
    
    // 編集モードが自動的にオンになるべきか判定
    const shouldEnableEditMode = initialEditMode || (localEmployees.length === 0);
    if (shouldEnableEditMode) {
      console.log('自動的に編集モードを有効化');
      setIsEditMode(true);
      setIsEditing(true); // 埋め込みモードとの互換性のため
    }
  }, []);

  // フィールド更新ハンドラー
  const handleFieldChange = (id: number, field: string, value: string) => {
    console.log('handleFieldChange 開始:', { id, field, value });
    setLocalEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, [field]: value } : emp
      )
    );
    console.log('handleFieldChange 完了');
  };

  // 月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    console.log('handleMonthlyStatusChange 開始:', { id, monthIndex, value });
    
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
      console.log('handleMonthlyStatusChange 完了: 空入力を0として処理');
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
      console.log('handleMonthlyStatusChange 完了: 有効な値を設定', { numValue });
    } else {
      // 無効な値の場合、エラーメッセージを表示
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
      console.log('handleMonthlyStatusChange 完了: 無効な値', { value });
    }
  };

  // 編集モード切り替え
  const toggleEditMode = () => {
    console.log('toggleEditMode 開始:', { 現在の状態: isEditMode, 新しい状態: !isEditMode });
    
    // 編集モードオフに切り替える場合のみ、元のデータに戻す
    if (isEditMode) {
      setLocalEmployees(employees);
      setErrorMessage(null);
      console.log('編集モードをオフに: データをリセット');
    }
    
    // 親コンポーネントの編集モードを更新
    setIsEditMode(!isEditMode);
    setIsEditing(!isEditMode); // 埋め込みモードとの互換性のため
    
    console.log('toggleEditMode 完了:', { 新しい状態: !isEditMode });
  };

  // 保存ボタンのハンドラー（更新された関数）
  const handleSave = async () => {
    console.log('handleSave 開始');
    
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
      console.log('handleSave: 検証エラー - 無効な月次ステータス値');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      if (isEmbedded && onDetailCellChange) {
        // 埋め込みモードの場合の処理
        console.log('handleSave: 埋め込みモードでの保存開始');
        onDetailCellChange(localData);
        console.log('handleSave: 埋め込みモードでの保存完了');
      } else {
        // 独立モードの場合
        console.log('handleSave: 独立モードでの保存開始');
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
              console.log('handleSave: 従業員データ更新', { employeeId: emp.id, changedFields });
              await updateEmployeeData(year, month, emp.id, changedFields);
              
              // 親コンポーネントにも変更を通知（ローカル更新用）
              Object.entries(changedFields).forEach(([field, value]) => {
                onEmployeeChange(emp.id, field, value);
              });
            }
          }
        }
        console.log('handleSave: 独立モードでの保存完了');
      }
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        console.log('handleSave: 親コンポーネントにリフレッシュを通知');
        onRefreshData();
      }
      
      setIsEditMode(false);
      setIsEditing(false); // 埋め込みモードとの互換性のため
      alert('従業員データを保存しました');
      console.log('handleSave 完了: 保存成功');
    } catch (error) {
      console.error('従業員データ保存エラー:', error);
      setErrorMessage(handleApiError(error));
      console.log('handleSave 完了: エラー発生', { error });
    } finally {
      setIsLoading(false);
    }
  };

  // 従業員追加ハンドラー
  const handleAddEmployee = () => {
    console.log('handleAddEmployee 開始');
    
    // 新しい従業員の仮ID
    const tempId = -Date.now(); // 負の値で一時IDを作成
    
    // 新しい従業員オブジェクトを作成
    const newEmployee = {
      id: tempId,
      no: localEmployees.length + 1,
      employee_id: '',
      name: '',
      disability_type: '',
      disability: '',
      grade: '',
      hire_date: new Date().toISOString().split('T')[0].split('-').join('/'),
      status: '在籍',
      count: 1, // Employeeタイプに必要なcountプロパティを追加
      monthlyStatus: Array(12).fill(1),
      memo: ''
    };
    
    // 現在の従業員リストに追加
    setLocalEmployees(prev => [...prev, newEmployee]);
    console.log('handleAddEmployee 完了:', { newEmployeeId: tempId, totalEmployees: localEmployees.length + 1 });
  };

  // セル編集の開始
  const handleCellFocus = (empId: number, monthIndex: number) => {
    console.log('handleCellFocus 開始:', { empId, monthIndex });
    setActiveCell({ empId, monthIndex });
    console.log('handleCellFocus 完了');
  };

  // キーボード操作ハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, empId: number, monthIndex: number) => {
    console.log('handleKeyDown 開始:', { key: e.key, empId, monthIndex });
    const currentEmpIndex = localEmployees.findIndex(emp => emp.id === empId);
    
    // 矢印キーによるナビゲーション
    if (isEditMode && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
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
            console.log('handleKeyDown: フォーカス移動', { 
              nextEmpId, 
              nextMonthIndex,
              nextEmpIndex,
              成功: !!inputElement 
            });
          }
        }, 0);
      }
    }
    
    // Enterキーでも次の行に移動
    if (isEditMode && e.key === 'Enter') {
      e.preventDefault();
      
      if (currentEmpIndex < localEmployees.length - 1) {
        const nextEmpId = localEmployees[currentEmpIndex + 1].id;
        const inputKey = `input-${nextEmpId}-${monthIndex}`;
        
        setTimeout(() => {
          const inputElement = inputRefs.current[inputKey];
          if (inputElement) {
            inputElement.focus();
            inputElement.select();
            console.log('handleKeyDown: Enterキーで次の行に移動', { 
              nextEmpId, 
              nextEmpIndex: currentEmpIndex + 1,
              成功: !!inputElement 
            });
          }
        }, 0);
      }
    }
    
    // Tabキーで右に移動、Shift+Tabで左に移動
    if (isEditMode && e.key === 'Tab') {
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
            console.log('handleKeyDown: Tabキーでセル移動', { 
              shiftKey: e.shiftKey,
              nextEmpId,
              nextMonthIndex,
              nextEmpIndex,
              成功: !!inputElement 
            });
          }
        }, 0);
      }
    }
    
    console.log('handleKeyDown 完了');
  };

  // 印刷
  const handlePrint = (): void => {
    console.log('handlePrint 開始');
    window.print();
    console.log('handlePrint 完了');
  };

  // CSVエクスポート
  const exportToCSV = (): void => {
    console.log('exportToCSV 開始');
    alert('CSVエクスポート機能はまだ実装されていません');
    console.log('exportToCSV 完了');
  };

  // ステータスの取得（確定状態のチェック）
  const currentStatus = summaryData.status || '未確定';
  const isConfirmed = currentStatus === '確定済';
  
  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // 従業員データがない場合
  const hasNoEmployees = !employees || employees.length === 0;

  if (hasNoEmployees) {
    return (
      <div style={noDataMessageStyle}>
        <p style={{ marginBottom: '20px' }}>従業員データがありません。</p>
        
        {/* 新規作成用ボタンを追加 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={() => {
              // 空の従業員配列を設定
              setLocalEmployees([
                {
                  id: Date.now(), // 一時的なIDとして現在時刻を使用
                  no: 1,
                  employee_id: '',
                  name: '',
                  disability_type: '',
                  disability: '',
                  grade: '',
                  hire_date: new Date().toISOString().split('T')[0].split('-').join('/'),
                  status: '在籍',
                  count: 1, // Employeeタイプに必要なcountプロパティを追加
                  monthlyStatus: Array(12).fill(1),
                  memo: ''
                }
              ]);
              setIsEditMode(true);
              setIsEditing(true); // 埋め込みモードとの互換性のため
              console.log('従業員詳細: 新規作成ボタンがクリックされました');
              
              // 親コンポーネントにも通知（任意）
              if (onRefreshData) {
                onRefreshData();
              }
            }}
            style={primaryButtonStyle}
          >
            新規作成
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employees-tab-container">
      <div className="data-container">
        {/* 集計サマリー情報 */}
        <div style={summaryBoxStyle}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '10px' }}>2024年集計サマリー</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <span>常用労働者数: 525名</span>
            <span>|</span>
            <span>障害者数: 5名</span>
            <span>|</span>
            <span>雇用カウント: 12.75</span>
            <span>|</span>
            <span>実雇用率: 2.43%</span>
            <span>|</span>
            <span>法定雇用率: 2.3%</span>
          </div>
        </div>
        
        {/* ヘッダーとアクションボタン */}
        <div style={sectionHeaderStyle}>
                          <h3 style={{ margin: 0 }}>従業員詳細</h3>
          <div style={buttonAreaStyle}>
            <button 
              type="button"
              className="edit-button"
              onClick={toggleEditMode}
              style={buttonStyle}
              disabled={isLoading}
            >
              {isEditMode ? '編集中止' : '編集'}
            </button>
            
            {isEditMode && (
              <>
                <button 
                  type="button"
                  onClick={handleAddEmployee}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#28a745',
                    color: 'white',
                    marginLeft: '10px'
                  }}
                  disabled={isLoading}
                >
                  従業員追加
                </button>
                
                <button 
                  type="button"
                  onClick={handleSave}
                  style={primaryButtonStyle}
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* 編集モード時のインジケーター */}
        {isEditMode && (
          <div style={editModeIndicatorStyle}>
            <span style={{ fontWeight: 'bold' }}>編集モード</span>：変更後は「保存」ボタンをクリックしてください。
          </div>
        )}
        
        {/* エラーとローディング表示 */}
        {errorMessage && <div style={errorMessageStyle}>{errorMessage}</div>}
        {isLoading && <div style={loadingIndicatorStyle}>データを処理中...</div>}
        
        {/* 従業員テーブル */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>No.</th>
                <th style={tableHeaderStyle}>社員ID</th>
                <th style={tableHeaderStyle}>氏名</th>
                <th style={tableHeaderStyle}>障害区分</th>
                <th style={tableHeaderStyle}>障害</th>
                <th style={tableHeaderStyle}>等級</th>
                <th style={tableHeaderStyle}>採用日</th>
                <th style={tableHeaderStyle}>状態</th>
                {months.map((month, index) => (
                  <th key={`month-${index}`} style={{ ...tableHeaderStyle, textAlign: 'center' }}>{month}</th>
                ))}
                <th style={tableHeaderStyle}>備考</th>
              </tr>
            </thead>
            <tbody>
              {localEmployees.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ ...tableCellStyle, position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{employee.no}</td>
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
                      <span style={statusBadgeStyle}>{employee.status}</span>
                    )}
                  </td>
                  {/* 月次ステータス入力欄 */}
                  {(employee.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                    <td key={`${employee.id}-month-${monthIndex}`} style={{ 
                      ...tableCellStyle,
                      textAlign: 'center',
                      backgroundColor: activeCell?.empId === employee.id && activeCell?.monthIndex === monthIndex ? '#e9f2ff' : 'white'
                    }}>
                      {isEditMode ? (
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
                  {/* 備考欄 */}
                  <td style={tableCellStyle}>
                    {isEditMode ? (
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
        
        {/* 入力方法のガイド表示 */}
        {isEditMode && (
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
        
        {/* アクションバー */}
        <div style={actionBarStyle}>
          <button onClick={handlePrint} style={buttonStyle}>
            印刷
          </button>
          <button onClick={exportToCSV} style={primaryButtonStyle}>
            CSVエクスポート
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesTab;