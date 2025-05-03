// src/pages/MonthlyReport/EmployeesTab.tsx
import React, { useState, useEffect, useRef } from 'react';

// 型定義
export interface Employee {
  id: number;
  no?: number;
  employee_id: string | number; // 文字列または数値を許容
  name: string;
  disability_type: string;
  disability: string;
  grade: string;
  hire_date: string;
  status: string;
  monthlyStatus?: number[];
  memo?: string;
  count?: number;
}

export interface MonthlyTotal {
  id?: number;
  fiscal_year?: number;
  month?: number;
  status?: string;
  deadline?: string;
  confirmed_at?: string;
  body_count?: number;
  intellectual_count?: number;
  mental_count?: number;
  total_count?: number;
  created_at?: string;
  updated_at?: string;
  employees_count?: number; 
  fulltime_count?: number;
  parttime_count?: number;
  legal_employment_rate?: number;
  employment_rate?: number;
  required_count?: number;
  over_under_count?: number;
  level1_2_count?: number;
  other_disability_count?: number;
  level1_2_parttime_count?: number;
  other_parttime_count?: number;
}

// API関数の簡易実装
const reportApi = {
  getMonthlyReport: async (year: number, month: number) => {
    // 本番環境ではサーバーから取得する実装に置き換え
    console.log(`${year}年${month}月のデータを取得しています...`);
    return { data: { employees: [] } };
  },
  updateEmployeeData: async (year: number, month: number, employeeId: number, data: Record<string, string>) => {
    console.log(`${year}年${month}月の従業員ID:${employeeId}を更新しています...`);
    return { success: true };
  },
  createEmployeeDetail: async (year: number, month: number, data: Omit<Employee, 'id'>) => {
    console.log(`${year}年${month}月に新規従業員を追加しています...`);
    return { ...data, id: Math.floor(Math.random() * 1000) + 1 };
  },
  deleteEmployeeData: async (year: number, month: number, employeeId: number) => {
    console.log(`${year}年${month}月の従業員ID:${employeeId}を削除しています...`);
    return { success: true };
  },
  handleApiError: (error: any): string => {
    return `エラーが発生しました: ${error.message || '不明なエラー'}`;
  }
};

// YearMonthContext の簡易実装
const useYearMonth = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  
  return { fiscalYear, month, setFiscalYear, setMonth };
};

// 親コンポーネントから受け取る props の型定義
interface EmployeesTabProps {
  employees?: Employee[];
  onEmployeeChange?: (id: number, field: string, value: string) => void;
  summaryData?: MonthlyTotal;
  onRefreshData?: () => void;
  isEditing?: boolean;
  onToggleEditMode?: () => void;
  onSaveSuccess?: () => void;
  editingStyles?: React.CSSProperties;
  buttonStyles?: Record<string, React.CSSProperties>;
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

// サンプルの従業員データ
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

// EmployeesTabコンポーネント
const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees = [],
  onEmployeeChange = () => {},
  summaryData = {},
  onRefreshData,
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
  
  // 内部編集状態 - デフォルトをfalseに設定
  const [internalIsEditing, setInternalIsEditing] = useState<boolean>(false);
  
  // 実際に使用する編集状態 - 修正: OR条件に変更（どちらかがtrueなら編集モード）
  const actualIsEditing = isEditing || internalIsEditing;
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  
  // 編集中のデータを保持するための状態
  const [unsavedChanges, setUnsavedChanges] = useState<{[year: number]: Employee[]}>({});
  
  // 新規行追加モード用の状態
  const [isAddingNewRow, setIsAddingNewRow] = useState<boolean>(false);
  const [newRowData, setNewRowData] = useState<Omit<Employee, 'id'>>({...defaultEmployee});
  
  // 現在フォーカスしているセルの状態
  const [focusedInput, setFocusedInput] = useState<{id: number | string, field: string, index?: number} | null>(null);
  
  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 成功メッセージ状態
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // データが初期化されたかどうかのフラグ
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

  // 入力フィールドの参照を保持
  const inputRefs = useRef<{[key: string]: HTMLInputElement | HTMLSelectElement | null}>({});

  // イベントリスナー設定用の参照
  const isEventListenerSet = useRef<boolean>(false);

  // グローバルイベントの設定 - 簡素化: 年度変更イベントのみ
  useEffect(() => {
    if (!isEventListenerSet.current) {
      // 年度変更イベントのリスナーを追加
      const handleGlobalYearChange = (e: CustomEvent) => {
        console.log('グローバル年度変更イベント受信:', e.detail);
        if (e.detail && e.detail.year) {
          fetchEmployeesByYear(e.detail.year);
        }
      };

      // イベントリスナーを追加（年度変更のみ）
      window.addEventListener('fiscalYearChanged', handleGlobalYearChange as EventListener);

      isEventListenerSet.current = true;

      // クリーンアップ関数
      return () => {
        window.removeEventListener('fiscalYearChanged', handleGlobalYearChange as EventListener);
      };
    }
  }, []);

  // 年度変更時に従業員データを取得する関数（改善版）
  const fetchEmployeesByYear = async (year: number) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`${year}年${month}月の従業員データを取得中...`);
      
      // 明示的にAPIを呼び出してデータを取得 - 現在の月を必ず渡す
      const response = await reportApi.getMonthlyReport(year, month);
      
      if (response && response.data && response.data.employees) {
        console.log(`${year}年${month}月の従業員データを取得成功:`, response.data.employees);
        
        // 型変換してセット (特にemployee_idの処理)
        const processedEmployees = response.data.employees.map((emp: any) => ({
          ...emp,
          employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
          disability_type: emp.disability_type || '',
          disability: emp.disability || '',
          grade: emp.grade || '',
          status: emp.status || '在籍'
        }));
        
        setLocalEmployees(processedEmployees);
        setIsInitialized(true);
        
        // 未保存データも更新（APIとの同期を保つ）
        if (processedEmployees.length > 0) {
          setUnsavedChanges(prev => ({
            ...prev,
            [year]: processedEmployees
          }));
        } else {
          // 空の場合は未保存データから削除
          setUnsavedChanges(prev => {
            const newState = { ...prev };
            delete newState[year];
            return newState;
          });
        }
        
        if (processedEmployees.length > 0) {
          // 成功メッセージ表示
          setSuccessMessage(`${year}年度のデータを読み込みました（${processedEmployees.length}件）`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          console.log(`${year}年度の従業員データは空です`);
          
          // 空のデータで更新
          setLocalEmployees([]);
        }
      } else {
        console.log(`${year}年度の従業員データは空です`);
        // 空のデータで更新
        setLocalEmployees([]);
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    } catch (error: any) {
      console.error(`${year}年度の従業員データ取得エラー:`, error);
      setErrorMessage(`データ取得エラー: ${reportApi.handleApiError(error)}`);
      
      // APIエラー時の処理
      if (!isInitialized) {
        setIsInitialized(true);
      }
      
      // 既存データを保持して再取得エラーを防ぐ
      if (unsavedChanges[year] && unsavedChanges[year].length > 0) {
        console.log(`APIエラーのため${year}年度の未保存データを使用`);
        setLocalEmployees(unsavedChanges[year]);
      } else {
        setLocalEmployees([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // キーボードナビゲーション用関数
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, id: number | string, field: string, index?: number) => {
    // 左右の矢印キーでナビゲーション
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      
      const isMonthlyStatus = field === 'monthlyStatus';
      const currentIndex = index !== undefined ? index : -1;
      
      // フィールドの順序定義
      const fieldOrder = [
        'employee_id', 'name', 'disability_type', 'disability', 'grade', 
        'hire_date', 'status', 'monthlyStatus', 'memo'
      ];
      
      let currentFieldIndex = fieldOrder.indexOf(field);
      
      // 月次ステータスの場合、インデックスを考慮
      if (isMonthlyStatus) {
        if (e.key === 'ArrowLeft') {
          if (currentIndex > 0) {
            // 同じフィールドの前の月へ
            focusInput(id, field, currentIndex - 1);
          } else {
            // 前のフィールドへ
            focusInput(id, fieldOrder[currentFieldIndex - 1]);
          }
        } else { // ArrowRight
          if (currentIndex < 11) {
            // 同じフィールドの次の月へ
            focusInput(id, field, currentIndex + 1);
          } else {
            // 次のフィールドへ
            focusInput(id, fieldOrder[currentFieldIndex + 1]);
          }
        }
      } else {
        // 通常フィールドの場合
        if (e.key === 'ArrowLeft' && currentFieldIndex > 0) {
          const prevField = fieldOrder[currentFieldIndex - 1];
          if (prevField === 'monthlyStatus') {
            // 月次ステータスの最後の月へ
            focusInput(id, prevField, 11);
          } else {
            focusInput(id, prevField);
          }
        } else if (e.key === 'ArrowRight' && currentFieldIndex < fieldOrder.length - 1) {
          const nextField = fieldOrder[currentFieldIndex + 1];
          if (nextField === 'monthlyStatus') {
            // 月次ステータスの最初の月へ
            focusInput(id, nextField, 0);
          } else {
            focusInput(id, nextField);
          }
        }
      }
    }
  };

  // 特定の入力フィールドにフォーカスする関数
  const focusInput = (id: number | string, field: string, index?: number) => {
    const refKey = `${id}-${field}${index !== undefined ? `-${index}` : ''}`;
    setTimeout(() => {
      const inputElement = inputRefs.current[refKey];
      if (inputElement) {
        inputElement.focus();
        if (inputElement instanceof HTMLInputElement) {
          inputElement.select();
        }
      }
    }, 0);
    
    // フォーカス状態を更新
    setFocusedInput({ id, field, index });
  };

  // props変更時にローカルデータを更新
  useEffect(() => {
    console.log('従業員データ更新:', employees);
    
    // データが既に初期化されていて、新しいデータが空の場合は更新しない
    if (isInitialized && employees.length === 0) {
      return;
    }
    
    if (employees && employees.length > 0) {
      // 従業員データの型変換を行う（特にemployee_idの処理）
      const processedEmployees = employees.map(emp => ({
        ...emp,
        employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
        disability_type: emp.disability_type || '',
        disability: emp.disability || '',
        grade: emp.grade || '',
        status: emp.status || '在籍'
      }));
      
      setLocalEmployees(processedEmployees);
      setIsInitialized(true);
    } else if (!isInitialized) {
      // 初期データがない場合はAPIから取得を試みる
      fetchEmployeesByYear(fiscalYear);
    }
  }, [employees, isInitialized, fiscalYear]);

  // 年度変更時のデータ管理（改善版）
  useEffect(() => {
    console.log('年度変更を検知:', fiscalYear);
    
    // データが初期化された後で年度が変更されたときだけデータを再取得
    if (isInitialized) {
      // 処理中フラグを立てる
      setIsLoading(true);
      
      // 現在のデータが存在し、かつ編集モードの場合は未保存データを保存
      if (localEmployees.length > 0 && actualIsEditing) {
        // 現在の年度のデータを一時保存
        setUnsavedChanges(prev => ({
          ...prev,
          [fiscalYear]: [...localEmployees]
        }));
        console.log(`${fiscalYear}年度の未保存データを一時保存:`, localEmployees);
      }
      
      // APIからのデータ取得処理
      const fetchData = async () => {
        try {
          // まず、未保存データがあるか確認
          if (unsavedChanges[fiscalYear] && unsavedChanges[fiscalYear].length > 0) {
            console.log(`${fiscalYear}年度の未保存データを復元:`, unsavedChanges[fiscalYear]);
            setLocalEmployees(unsavedChanges[fiscalYear]);
          } else {
            // 未保存データがなければAPIから取得
            console.log(`${fiscalYear}年度のデータをAPIから取得します`);
            await fetchEmployeesByYear(fiscalYear);
          }
        } catch (error) {
          console.error(`${fiscalYear}年度のデータ取得中にエラーが発生:`, error);
          setErrorMessage('データの取得中にエラーが発生しました');
          setTimeout(() => setErrorMessage(null), 5000);
        } finally {
          setIsLoading(false);
        }
      };
      
      // 即時実行（遅延を削除）
      fetchData();
    }
  }, [fiscalYear, month]); // 月も依存関係に追加

  // 編集モード切り替えハンドラー - シンプル化
  const handleToggleEditMode = () => {
    console.log('編集モード切替ボタンクリック:', !actualIsEditing);
    
    // 内部状態をまず更新（これだけでも反映されるようにする）
    setInternalIsEditing(!internalIsEditing);
    console.log('内部編集状態を更新:', internalIsEditing, '→', !internalIsEditing);
    
    // 親コンポーネントの関数がある場合は呼び出す
    if (onToggleEditMode) {
      // 必ず親の状態も更新するよう明示的に呼び出す
      console.log('親コンポーネントの編集状態変更関数を呼び出し');
      onToggleEditMode();
    }
    
    // 編集モード終了時の処理（条件は現在の状態で判定）
    if (actualIsEditing) {
      setErrorMessage(null);
      setIsAddingNewRow(false); // 新規行追加モードをキャンセル
    }
  };

  // 年度変更ハンドラー - データ永続化を強化
  const handleYearChange = async (newYear: number) => {
    console.log(`年度変更開始: ${fiscalYear} → ${newYear}`);
    
    // 編集中のデータが存在する場合は保存処理を実行
    if (actualIsEditing) {
      try {
        // 新規追加モードの場合
        if (isAddingNewRow && newRowData.name) {
          console.log('年度変更前に新規データを保存します');
          await handleSaveNewRow();
        } 
        // 既存データの編集中の場合
        else if (localEmployees.length > 0) {
          console.log('年度変更前に編集中のデータを保存します');
          await handleSave();
        }
      } catch (error) {
        console.error('年度変更前のデータ保存エラー:', error);
        // エラーが発生しても続行するが、ユーザーに通知
        setErrorMessage('データ保存中にエラーが発生しました。年度を切り替えると編集内容が失われる可能性があります。');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    }
    
    // 年度変更を実行（APIから新しいデータを取得するように修正）
    await processYearChange(newYear);
  };

  // 年度変更の実際の処理（強化版）
  const processYearChange = async (newYear: number) => {
    setIsLoading(true);
    
    try {
      // 編集モードを終了
      if (actualIsEditing) {
        setInternalIsEditing(false);
      }
      
      // まずローカル状態を更新
      if (setFiscalYear) {
        setFiscalYear(newYear);
      }
      
      // APIから新しい年度のデータを明示的に取得
      console.log(`${newYear}年度のデータを明示的に取得します`);
      
      // 未保存データをクリア（実際のデータを優先するため）
      setUnsavedChanges({});
      
      // 次に親コンポーネントに通知（これによりAPIからデータが取得される）
      if (onYearChange) {
        onYearChange(newYear);
      }
      
      // グローバルコンテキストを強制的に更新（イベントディスパッチで）
      const yearChangeEvent = new CustomEvent('fiscalYearChanged', { 
        detail: { year: newYear, month: month }  // 月の情報も含める
      });
      window.dispatchEvent(yearChangeEvent);
      
      // 年度変更後に明示的にデータ再取得を実行
      await fetchEmployeesByYear(newYear);
      
      setSuccessMessage(`${newYear}年度のデータを読み込みました`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('年度変更処理エラー:', error);
      setErrorMessage('年度変更処理中にエラーが発生しました');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // フィールド更新ハンドラー - 未保存データの管理を追加
  const handleFieldChange = (id: number, field: string, value: string | number) => {
    console.log(`フィールド変更: ID=${id}, フィールド=${field}, 値=${value}`);
    setLocalEmployees(prev => {
      const updated = prev.map(emp => 
        emp.id === id ? { ...emp, [field]: value } : emp
      );
      // 変更があったら現在の年度の未保存データも更新
      setUnsavedChanges(prev => ({
        ...prev,
        [fiscalYear]: [...updated]
      }));
      return updated;
    });
  };

  // 新規行データの更新ハンドラー
  const handleNewRowFieldChange = (field: string, value: string | number) => {
    console.log(`新規行フィールド変更: フィールド=${field}, 値=${value}`);
    setNewRowData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 月次ステータス更新ハンドラー（既存従業員用）
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    console.log(`月次ステータス変更: ID=${id}, 月=${monthIndex}, 値=${value}`);
    // 値の検証 (0, 0.5, 1, 2のみ許可)
    const numValue = parseFloat(value);
    const validValues = [0, 0.5, 1, 2];
    
    if (value === "") {
      setLocalEmployees(prev => {
        const updated = prev.map(emp => {
          if (emp.id === id) {
            const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(1))];
            newMonthlyStatus[monthIndex] = 0; // 空の入力は0として扱う
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        });
        
        // 変更があったら現在の年度の未保存データも更新
        setUnsavedChanges(prev => ({
          ...prev,
          [fiscalYear]: [...updated]
        }));
        
        return updated;
      });
      setErrorMessage(null);
    } else if (!isNaN(numValue) && validValues.includes(numValue)) {
      setLocalEmployees(prev => {
        const updated = prev.map(emp => {
          if (emp.id === id) {
            const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(1))];
            newMonthlyStatus[monthIndex] = numValue;
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        });
        
        // 変更があったら現在の年度の未保存データも更新
        setUnsavedChanges(prev => ({
          ...prev,
          [fiscalYear]: [...updated]
        }));
        
        return updated;
      });
      setErrorMessage(null);
    } else {
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
    }
  };

  // 新規行の月次ステータス更新ハンドラー
  const handleNewRowMonthlyStatusChange = (monthIndex: number, value: string) => {
    console.log(`新規行月次ステータス変更: 月=${monthIndex}, 値=${value}`);
    const numValue = parseFloat(value);
    const validValues = [0, 0.5, 1, 2];
    
    if (value === "") {
      // 空の場合は0とする
      setNewRowData(prev => {
        const newMonthlyStatus = [...(prev.monthlyStatus || Array(12).fill(1))];
        newMonthlyStatus[monthIndex] = 0;
        return {
          ...prev,
          monthlyStatus: newMonthlyStatus
        };
      });
      setErrorMessage(null);
      return;
    }
    
    if (isNaN(numValue) || !validValues.includes(numValue)) {
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
      return;
    }
    
    setNewRowData(prev => {
      const newMonthlyStatus = [...(prev.monthlyStatus || Array(12).fill(1))];
      newMonthlyStatus[monthIndex] = numValue;
      return {
        ...prev,
        monthlyStatus: newMonthlyStatus
      };
    });
    setErrorMessage(null);
  };

  // 新規追加行を表示するハンドラー
  const handleAddNewRow = () => {
    console.log('新規行追加を開始');
    
    // 編集モードでなければ編集モードに切り替え
    if (!actualIsEditing) {
      // 内部状態を直接更新
      setInternalIsEditing(true);
      
      // 親コンポーネントの関数があれば呼び出す
      if (onToggleEditMode) {
        onToggleEditMode();
      }
    }
    
    // 新規行データを初期化
    const nextNo = Math.max(...localEmployees.map(emp => emp.no || 0), 0) + 1;
    setNewRowData({
      ...defaultEmployee,
      no: nextNo
    });
    
    // 新規行追加モードをオン
    setIsAddingNewRow(true);
  };

  // 新規行のキャンセルハンドラー
  const handleCancelNewRow = () => {
    console.log('新規行追加をキャンセル');
    setIsAddingNewRow(false);
    setErrorMessage(null);
  };

  // 従業員データの削除ハンドラー
  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('この従業員データを削除してもよろしいですか？')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`従業員削除開始: ID=${id}`);
      await reportApi.deleteEmployeeData(fiscalYear, month, id);
      
      // 削除成功
      setLocalEmployees(prev => {
        const updated = prev.filter(emp => emp.id !== id);
        
        // 変更があったら現在の年度の未保存データも更新
        setUnsavedChanges(prev => ({
          ...prev,
          [fiscalYear]: [...updated]
        }));
        
        return updated;
      });
      
      setSuccessMessage('従業員データを削除しました');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // 親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error: any) {
      console.error('従業員削除エラー:', error);
      setErrorMessage(reportApi.handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // 新規行の保存ハンドラー（改善版）
  const handleSaveNewRow = async () => {
    // バリデーション
    if (!newRowData.name) {
      setErrorMessage("名前は必須です");
      return Promise.reject("名前は必須です");
    }
    
    if (!newRowData.employee_id) {
      setErrorMessage("社員IDは必須です");
      return Promise.reject("社員IDは必須です");
    }
    
    setIsLoading(true);
    
    try {
      // API呼び出し時に現在の月も明示的に指定
      console.log(`${fiscalYear}年${month}月に新規従業員データを作成します:`, newRowData);
      const createdEmployee = await reportApi.createEmployeeDetail(fiscalYear, month, newRowData);
      console.log(`作成された従業員データ:`, createdEmployee);
      
      // createdEmployeeが適切なデータを含むか確認
      let newEmp: Employee;
      
      if (createdEmployee && createdEmployee.id) {
        // APIからの応答に適切なデータがある場合
        newEmp = createdEmployee as Employee;
      } else {
        // APIからの応答に適切なデータがない場合、一時的なIDを生成
        const tempId = Math.max(...localEmployees.map(e => e.id || 0), 0) + 1;
        newEmp = {
          ...newRowData,
          id: tempId
        } as Employee;
      }
      
      // ローカルデータに追加
      setLocalEmployees(prev => {
        const updated = [...prev, newEmp];
        return updated;
      });
      
      // 現在の年度の未保存データを即時クリア（APIとの同期を保つため）
      setUnsavedChanges(prev => {
        const newState = { ...prev };
        delete newState[fiscalYear];
        return newState;
      });
      
      // 成功メッセージを表示
      setSuccessMessage('従業員データを作成しました');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // 新規行追加モードをオフ
      setIsAddingNewRow(false);
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        console.log('親コンポーネントにデータ更新を通知');
        onRefreshData();
      }
      
      // 明示的に再取得して同期を確実にする
      await fetchEmployeesByYear(fiscalYear);
      
      return Promise.resolve(newEmp);
    } catch (error: any) {
      console.error('従業員作成エラー:', error);
      setErrorMessage(reportApi.handleApiError(error));
      
      // エラーが発生しても、UIにはデータを反映（オフライン対応）
      const tempId = Math.max(...localEmployees.map(e => e.id || 0), 0) + 999;
      const tempEmployee = {
        ...newRowData, 
        id: tempId
      } as Employee;
      
      setLocalEmployees(prev => {
        const updated = [...prev, tempEmployee];
        return updated;
      });
      
      setSuccessMessage('従業員データをローカルに追加しました（APIエラーのため一時的）');
      
      // 新規行追加モードをオフ
      setIsAddingNewRow(false);
      
      return Promise.reject(error);
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
    console.log('従業員データ保存開始');
    
    try {
      // 変更をAPIに送信
      const originalEmployees = employees.length > 0 ? employees : [];
      
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
            try {
              console.log(`従業員ID=${emp.id}の更新データ:`, changedFields);
              await reportApi.updateEmployeeData(fiscalYear, month, emp.id, changedFields);
              
              // 親コンポーネントにも変更を通知
              Object.entries(changedFields).forEach(([field, value]) => {
                onEmployeeChange(emp.id, field, value);
              });
            } catch (error: any) {
              console.error(`従業員ID ${emp.id} の更新エラー:`, error);
              setErrorMessage(`従業員ID ${emp.id} の更新中にエラーが発生しましたが、他の変更の処理を続行します`);
            }
          }
        }
      }
      
      // 編集モード終了を親に通知
      onSaveSuccess();
      
      // 内部状態を更新
      setInternalIsEditing(false);
      
      // データ更新後に親コンポーネントに通知
      if (onRefreshData) {
        onRefreshData();
      }
      
      // 現在の年度の未保存データをクリア
      setUnsavedChanges(prev => {
        const newState = { ...prev };
        delete newState[fiscalYear];
        return newState;
      });
      
      // 成功メッセージを表示
      setSuccessMessage('従業員データを保存しました');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('従業員データ保存エラー:', error);
      setErrorMessage(reportApi.handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // ステータスの取得（確定状態のチェック）
  const currentStatus = summaryData?.status || '未確定';
  const isConfirmed = currentStatus === '確定済';

  // デフォルトのボタンスタイル
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

  // デバッグ情報
  const debugInfo = {
    fiscalYear,
    month,
    isEditing,
    internalIsEditing,
    actualIsEditing,
    employeesCount: localEmployees.length,
    propEmployeesCount: employees.length,
    unsavedChangesYears: Object.keys(unsavedChanges)
  };

  return (
    <div className="employees-tab-container">
      <div className="data-container">
        {/* デバッグ情報 - 開発環境のみ表示 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            margin: '10px 0', 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <details>
              <summary>デバッグ情報</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              <button onClick={() => console.log('従業員データ:', localEmployees)}>
                従業員データをコンソールに出力
              </button>
              <button onClick={() => console.log('未保存データ:', unsavedChanges)}>
                未保存データをコンソールに出力
              </button>
            </details>
          </div>
        )}
        
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
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* 編集・新規作成ボタン群 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isAddingNewRow && !actualIsEditing && (
                <button 
                  type="button"
                  onClick={handleToggleEditMode}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading || isConfirmed}
                >
                  編集
                </button>
              )}
              
              {!isAddingNewRow && (
                <button 
                  type="button"
                  onClick={handleAddNewRow}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading || isConfirmed || (actualIsEditing && isAddingNewRow)}
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

        {/* 未保存データの警告 */}
        {Object.keys(unsavedChanges).length > 1 && ( // 修正: 現在の年度以外に未保存データがある場合のみ表示
          <div style={{ 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {Object.keys(unsavedChanges).length - 1}年度分の未保存データがあります。
            各年度で「保存」ボタンを押して変更を確定してください。
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
                <th style={{ padding: '8px', textAlign: 'left' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {/* 既存の従業員データ行 */}
              {localEmployees.map((employee, index) => (
                <tr key={employee.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{employee.no || index + 1}</td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <input 
                        ref={(el) => { inputRefs.current[`${employee.id}-employee_id`] = el; }}
                        type="text" 
                        value={employee.employee_id || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'employee_id', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'employee_id')}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'employee_id' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.employee_id || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <input 
                        ref={(el) => { inputRefs.current[`${employee.id}-name`] = el; }}
                        type="text" 
                        value={employee.name || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'name')}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'name' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.name || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <select 
                        ref={(el) => { inputRefs.current[`${employee.id}-disability_type`] = el; }}
                        value={employee.disability_type || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'disability_type', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'disability_type')}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'disability_type' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
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
                        ref={(el) => { inputRefs.current[`${employee.id}-disability`] = el; }}
                        type="text" 
                        value={employee.disability || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'disability', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'disability')}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'disability' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.disability || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <input 
                        ref={(el) => { inputRefs.current[`${employee.id}-grade`] = el; }}
                        type="text" 
                        value={employee.grade || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'grade', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'grade')}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'grade' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.grade || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <input 
                        ref={(el) => { inputRefs.current[`${employee.id}-hire_date`] = el; }}
                        type="date"
                        value={(employee.hire_date || '').split('/').join('-')}
                        onChange={(e) => handleFieldChange(employee.id, 'hire_date', e.target.value.split('-').join('/'))}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'hire_date')}
                        style={{ 
                          width: '120px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'hire_date' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.hire_date || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <select 
                        ref={(el) => { inputRefs.current[`${employee.id}-status`] = el; }}
                        value={employee.status || '在籍'}
                        onChange={(e) => handleFieldChange(employee.id, 'status', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'status')}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'status' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
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
                    <td key={`${employee.id}-month-${monthIndex}`} style={{ padding: '4px', textAlign: 'center' }}>
                      {actualIsEditing ? (
                        <input 
                          ref={(el) => { inputRefs.current[`${employee.id}-monthlyStatus-${monthIndex}`] = el; }}
                          type="text" 
                          value={status}
                          onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, employee.id, 'monthlyStatus', monthIndex)}
                          onClick={() => focusInput(employee.id, 'monthlyStatus', monthIndex)}
                          style={{ 
                            width: '40px',
                            padding: '2px',
                            border: focusedInput?.id === employee.id && 
                                   focusedInput?.field === 'monthlyStatus' && 
                                   focusedInput?.index === monthIndex
                                ? '2px solid #007bff' 
                                : '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center',
                            backgroundColor: '#fff'
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
                        ref={(el) => { inputRefs.current[`${employee.id}-memo`] = el; }}
                        type="text" 
                        value={employee.memo || ''}
                        onChange={(e) => handleFieldChange(employee.id, 'memo', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, employee.id, 'memo')}
                        style={{ 
                          width: '150px',
                          padding: '4px',
                          border: focusedInput?.id === employee.id && focusedInput?.field === 'memo' 
                            ? '2px solid #007bff' 
                            : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.memo || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing && (
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        disabled={isLoading || isConfirmed}
                        title="この従業員を削除"
                      >
                        削除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* 新規追加行 - 追加モードの場合のみ表示 */}
              {isAddingNewRow && (
                <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#f8f9fa' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>{newRowData.no}</td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-employee_id`] = el; }}
                      type="text" 
                      value={newRowData.employee_id || ''}
                      onChange={(e) => handleNewRowFieldChange('employee_id', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'employee_id')}
                      placeholder="社員ID"
                      style={{ 
                        width: '60px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'employee_id' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-name`] = el; }}
                      type="text" 
                      value={newRowData.name || ''}
                      onChange={(e) => handleNewRowFieldChange('name', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'name')}
                      placeholder="氏名"
                      style={{ 
                        width: '100px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'name' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select 
                      ref={(el) => { inputRefs.current[`new-disability_type`] = el; }}
                      value={newRowData.disability_type || ''}
                      onChange={(e) => handleNewRowFieldChange('disability_type', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'disability_type')}
                      style={{ 
                        width: '100px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'disability_type' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="">なし</option>
                      <option value="身体障害">身体障害</option>
                      <option value="知的障害">知的障害</option>
                      <option value="精神障害">精神障害</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-disability`] = el; }}
                      type="text" 
                      value={newRowData.disability || ''}
                      onChange={(e) => handleNewRowFieldChange('disability', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'disability')}
                      placeholder="障害"
                      style={{ 
                        width: '80px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'disability' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-grade`] = el; }}
                      type="text" 
                      value={newRowData.grade || ''}
                      onChange={(e) => handleNewRowFieldChange('grade', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'grade')}
                      placeholder="等級"
                      style={{ 
                        width: '60px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'grade' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-hire_date`] = el; }}
                      type="date"
                      value={(newRowData.hire_date || '').split('/').join('-')}
                      onChange={(e) => handleNewRowFieldChange('hire_date', e.target.value.split('-').join('/'))}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'hire_date')}
                      style={{ 
                        width: '120px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'hire_date' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select 
                      ref={(el) => { inputRefs.current[`new-status`] = el; }}
                      value={newRowData.status || '在籍'}
                      onChange={(e) => handleNewRowFieldChange('status', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'status')}
                      style={{ 
                        width: '80px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'status' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="在籍">在籍</option>
                      <option value="休職">休職</option>
                      <option value="退職">退職</option>
                    </select>
                  </td>
                  {/* 新規行の月次ステータス入力欄 */}
                  {(newRowData.monthlyStatus || Array(12).fill(1)).map((status, monthIndex) => (
                    <td key={`new-month-${monthIndex}`} style={{ padding: '4px', textAlign: 'center' }}>
                      <input 
                        ref={(el) => { inputRefs.current[`new-monthlyStatus-${monthIndex}`] = el; }}
                        type="text" 
                        value={status}
                        onChange={(e) => handleNewRowMonthlyStatusChange(monthIndex, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'new', 'monthlyStatus', monthIndex)}
                        onClick={() => focusInput('new', 'monthlyStatus', monthIndex)}
                        style={{ 
                          width: '40px',
                          padding: '2px',
                          border: focusedInput?.id === 'new' && 
                                 focusedInput?.field === 'monthlyStatus' && 
                                 focusedInput?.index === monthIndex
                               ? '2px solid #007bff' 
                               : '1px solid #007bff',
                          borderRadius: '4px',
                          textAlign: 'center',
                          backgroundColor: '#fff'
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-memo`] = el; }}
                      type="text" 
                      value={newRowData.memo || ''}
                      onChange={(e) => handleNewRowFieldChange('memo', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'new', 'memo')}
                      placeholder="備考"
                      style={{ 
                        width: '150px',
                        padding: '4px',
                        border: focusedInput?.id === 'new' && focusedInput?.field === 'memo' 
                          ? '2px solid #007bff' 
                          : '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={handleSaveNewRow}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        disabled={isLoading}
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelNewRow}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        disabled={isLoading}
                      >
                        キャンセル
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* データが無い場合のメッセージ行 */}
              {localEmployees.length === 0 && !isAddingNewRow && (
                <tr>
                  <td colSpan={22} style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>従業員データがありません</p>
                    <button 
                      type="button"
                      onClick={handleAddNewRow}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
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

        {/* 編集中の場合のみ表示するアクション領域 */}
        {actualIsEditing && !isAddingNewRow && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '10px', 
            marginTop: '10px' 
          }}>
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
              {isLoading ? '保存中...' : '変更を保存'}
            </button>
          </div>
        )}
        
        {/* 入力方法のガイド表示 - 編集モード時のみ表示 */}
        {actualIsEditing && (
          <div style={{ marginTop: '15px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>操作方法</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
              <li>入力可能な月次ステータスの値: 0, 0.5, 1, 2</li>
              <li>左右の矢印キーでセル間を移動できます</li>
              <li>セルをクリックして直接編集できます</li>
              <li>変更後は「変更を保存」ボタンを押してください</li>
            </ul>
          </div>
        )}
        
        {/* 状態変更のデバッグ情報 - 非表示トグル可能 */}
        <div style={{ marginTop: '15px' }}>
          <details>
            <summary style={{ cursor: 'pointer', color: '#666', fontSize: '13px' }}>
              トラブルシューティング情報
            </summary>
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '10px', 
              borderRadius: '4px', 
              marginTop: '5px',
              fontSize: '12px'
            }}>
              <p>編集ボタンやデータの問題が発生している場合は以下をお試しください:</p>
              <ul>
                <li>ページを再読み込みしてから操作する</li>
                <li>年度を切り替えてからもう一度元の年度に戻る</li>
                <li>開発者ツール（F12）でコンソールエラーを確認する</li>
              </ul>
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>現在の状態:</p>
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: '5px', 
                  borderRadius: '3px',
                  border: '1px solid #ddd',
                  overflow: 'auto',
                  maxHeight: '100px'
                }}>
                  <pre style={{ margin: 0 }}>
                    編集モード: {String(actualIsEditing)}<br />
                    年度: {fiscalYear}<br />
                    月: {month}<br />
                    従業員数: {localEmployees.length}<br />
                    データ初期化済み: {String(isInitialized)}<br />
                    未保存データ: {Object.keys(unsavedChanges).length > 0 ? Object.keys(unsavedChanges).join(', ') + '年度' : 'なし'}
                  </pre>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default EmployeesTab;