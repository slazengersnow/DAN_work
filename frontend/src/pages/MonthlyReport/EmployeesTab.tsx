import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useYearMonth } from './YearMonthContext';
import EmployeeCSVImportModal from './EmployeeCSVImportModal';

// WH（雇用形態）の選択肢定義
const WH_OPTIONS = [
  { value: '正社員', label: '正社員' },
  { value: '短時間労働者', label: '短時間労働者' },
  { value: '特定短時間労働者', label: '特定短時間労働者' }
] as const;

// 型定義
export interface Employee {
  id: number;
  no?: number;
  employee_id: string | number;
  name: string;
  disability_type: string;
  disability: string;
  grade: string;
  hire_date: string;
  status: string;
  wh?: '正社員' | '短時間労働者' | '特定短時間労働者';  // 雇用形態を追加
  hc?: number;  // HC値を追加
  monthlyStatus?: any[];
  memo?: string;
  count?: number;
  retirement_date?: string; // 退職日を追加
  fiscal_year?: number;  // 年度情報
  inheritedFrom?: number;  // データの引き継ぎ元年度
  _timestamp?: string;  // タイムスタンプ
  _selected?: boolean;  // UI用の選択状態フラグ（データベースには保存されない）
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

// API関数の修正版（実際のバックエンドエンドポイントに合わせる）
const reportApi = {
  // 安全なレスポンス解析処理 - 共通関数化
  safeResponseParser: async (response: Response) => {
    if (response.ok) {
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('JSONパースエラー:', jsonError);
        throw new Error('不正な応答形式: JSONデータを解析できませんでした');
      }
    } else {
      // エラー応答の処理
      // 必ずレスポンスをクローンしてから本文を読み取る
      const clonedResponse = response.clone();
      let errorMessage = `API error: ${response.status}`;
      
      try {
        // JSONとしての解析を試みる
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        try {
          // テキストとしての読み取りを試みる（HTML応答などの検出）
          const text = await clonedResponse.text();
          
          // HTML応答のチェック
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            console.error('HTML形式のレスポンスを検出:', { 
              status: response.status,
              preview: text.substring(0, 100) + '...'
            });
            errorMessage = `APIがHTMLを返しました（ステータス: ${response.status}）`;
          }
        } catch (textError) {
          // テキスト読み取りも失敗した場合
          console.error('レスポンス本文読み取りエラー:', textError);
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // 年度で従業員データを取得（実装済みエンドポイントを使用）
  getEmployeesByYear: async (year: number) => {
    console.log(`${year}年の従業員データを取得しています...`);
    try {
      // 特定の年の処理 (2024年以降はモックデータまたはローカルストレージから取得)
      if (year >= 2024) {
        console.log(`${year}年以降のデータはローカルストレージとモックデータを併用します`);
        
        try {
          // ローカルストレージからデータを取得
          const storageKey = `EMPLOYEE_DATA_${year}`;
          console.log(`ストレージキー(読み込み時): ${storageKey}`);
          const savedData = localStorage.getItem(storageKey);
          
          // サンプルデータを準備（index.tsxと同じ内容）
          const sampleEmployees = [
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
              hc: 1,
              monthlyStatus: Array(12).fill(1), // 在籍状態なので全て1に設定
              memo: '',
              count: 0,
              fiscal_year: year
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
              hc: 0.5,
              monthlyStatus: Array(12).fill(0.5), // 在籍状態なので全て0.5に設定
              memo: '',
              count: 0,
              fiscal_year: year
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
              hc: 1,
              monthlyStatus: Array(12).fill(1), // 在籍状態なので全て1に設定
              memo: '',
              count: 0,
              fiscal_year: year
            }
          ];
          
          if (savedData) {
            // ローカルストレージのデータが存在する場合
            const savedEmployees = JSON.parse(savedData);
            // オブジェクトから配列に変換
            const employeesArray = Object.values(savedEmployees);
            
            if (employeesArray.length > 0) {
              console.log(`${year}年の従業員データをローカルストレージから取得しました:`, employeesArray);
              
              // ローカルストレージのデータのみを使用する（サンプルデータは結合しない）
              // 全データの詳細をログ出力（デバッグ用）
              console.log(`${year}年のローカルストレージからのデータ(${employeesArray.length}件):`, employeesArray);
              
              return { 
                data: { 
                  employees: employeesArray
                } 
              };
            }
          }
          
          // ローカルストレージにデータがない場合はサンプルデータを返す
          console.log(`${year}年のローカルストレージデータが見つからないため、サンプルデータを返します`);
          return { data: { employees: sampleEmployees } };
        } catch (storageError) {
          console.error('ローカルストレージ読み取りエラー:', storageError);
          // エラー時はサンプルデータを返す
          return { data: { employees: [] } };
        }
      }
      
      // axios スタイルのクライアントを使用（エンハンスドクライアントが理想的）
      const response = await fetch(`/api/employees?year=${year}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // 共通の安全なレスポンス処理を使用
      const data = await reportApi.safeResponseParser(response);
      return { data: { employees: data } };
    } catch (error) {
      console.error(`従業員データ取得エラー: ${error}`);
      // エラー発生時は空のデータを返す
      return { data: { employees: [] } };
    }
  },

  // 従業員データを更新（実装済みエンドポイントを使用）
  updateEmployeeData: async (year: number, employeeId: number, data: Record<string, string>) => {
    console.log(`${year}年の従業員ID:${employeeId}を更新しています...`, data);
    try {
      // 共通の月次ステータス処理関数
      const processMonthlyStatus = (inputData: Record<string, string>) => {
        const processedData = {...inputData};
        if (inputData.monthlyStatus) {
          try {
            // 文字列の場合はJSONパースする
            if (typeof inputData.monthlyStatus === 'string') {
              processedData.monthlyStatus = JSON.parse(inputData.monthlyStatus);
            }
            // それ以外の場合はそのまま使用
          } catch (e) {
            processedData.monthlyStatus = inputData.monthlyStatus;
          }
        }
        return processedData;
      };
      
      // 2024年以降のデータは特別処理 - 実際のAPIは呼び出さずにモック応答を返す
      if (year >= 2024) {
        console.log(`${year}年の従業員データはクライアント側で更新します（APIは呼び出しません）`);
        
        // データの加工処理（月次ステータスのJSON化など）
        const updateData = processMonthlyStatus(data);
        
        // ローカルストレージにデータを保存
        try {
          // 現在の保存データを取得
          const storageKey = `EMPLOYEE_DATA_${year}`;
          let savedEmployees = {};
          
          try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              savedEmployees = JSON.parse(savedData);
            }
          } catch (e) {
            console.error('ローカルストレージの読み取りエラー:', e);
          }
          
          // 既存データがある場合は、元のデータと新しいデータをマージする
          let existingEmployee = savedEmployees[employeeId] || {};
          
          // 従業員データを更新（既存データとマージ）
          savedEmployees = {
            ...savedEmployees,
            [employeeId]: {
              ...existingEmployee, // 既存のデータをベースにする
              id: employeeId,
              ...updateData, // 新しいデータで上書き
              fiscal_year: year,
              updated_at: new Date().toISOString()
            }
          };
          
          console.log(`更新するデータ:`, savedEmployees[employeeId]);
          
          // ローカルストレージに保存
          localStorage.setItem(storageKey, JSON.stringify(savedEmployees));
          console.log(`従業員ID=${employeeId}のデータをローカルストレージに保存しました`);
        } catch (storageError) {
          console.error('ローカルストレージへの保存エラー:', storageError);
        }
        
        // モックレスポンスを返す
        return {
          success: true,
          message: '従業員データをクライアント側で更新しました',
          employee: {
            id: employeeId,
            ...updateData,
            fiscal_year: year
          }
        };
      }
      
      // 実際のAPI呼び出し（2023年以前のデータ）
      const updateData = processMonthlyStatus(data);
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateData),
      });
      
      // 共通の安全なレスポンス処理を使用
      const responseData = await reportApi.safeResponseParser(response);
      return responseData;
    } catch (error) {
      console.error(`従業員更新エラー: ${error}`);
      
      // 2024年以降のデータの場合は、エラーをスローする代わりにモックレスポンスを返す
      if (year >= 2024) {
        console.log(`エラーが発生しましたが、${year}年の従業員はクライアント側で更新します`);
        
        return {
          success: true,
          message: 'データベース接続エラーが発生しましたが、クライアント側で更新しました',
          employee: {
            id: employeeId,
            ...data,
            fiscal_year: year
          }
        };
      }
      
      throw error;
    }
  },

  // 従業員データを作成（実装済みエンドポイントを使用）
  createEmployeeDetail: async (year: number, _month: number, data: Omit<Employee, 'id'>) => {
    // 月パラメータは不要なので使用しない（APIとの整合性のために残す）
    console.log(`${year}年に新規従業員を追加しています...`, data);
    
    try {
      // 入力データの検証
      if (!data.name) {
        throw new Error('社員名は必須項目です');
      }
      
      if (!data.employee_id) {
        throw new Error('社員IDは必須項目です');
      }
      
      // 2024年以降のデータは特別処理 - 実際のAPIは呼び出さずにモック応答を返す
      if (year >= 2024) {
        console.log(`${year}年のデータは直接作成します（APIは呼び出しません）`);
        
        // 一貫した仮ID生成 - タイムスタンプベースでより予測可能に
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 1000);
        const tempId = parseInt(`${timestamp % 100000}${randomPart}`.substring(0, 6));
        
        // 月次ステータスの初期化を確実に実施
        const employeeData = {
          ...data,
          monthlyStatus: Array.isArray(data.monthlyStatus) ? data.monthlyStatus : Array(12).fill('')
        };
        
        // データの欠損フィールドを初期化
        if (!employeeData.disability_type) employeeData.disability_type = '';
        if (!employeeData.disability) employeeData.disability = '';
        if (!employeeData.grade) employeeData.grade = '';
        if (!employeeData.memo) employeeData.memo = '';
        
        // 新規作成した従業員データをローカルストレージに保存
        try {
          // 現在の保存データを取得
          const storageKey = `EMPLOYEE_DATA_${year}`;
          let savedEmployees = {};
          
          try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              savedEmployees = JSON.parse(savedData);
            }
          } catch (e) {
            console.error('ローカルストレージの読み取りエラー:', e);
          }
          
          // ユニークなIDを生成 (既存IDの最大値 + 1 または 10000以上の値)
          // 既存のIDをすべて取得
          const existingIds = Object.keys(savedEmployees).map(id => parseInt(id, 10));
          // 最低でも10000以上の値を使う（サンプルデータのIDとの衝突を避けるため）
          const minId = Math.max(...existingIds, 10000);
          // さらに大きい値を使うためにタイムスタンプと組み合わせる
          const customId = Math.max(tempId, minId + 1);
          
          // 既存の従業員からno値の最大値を見つける
          // ローカルストレージ内の既存従業員からnoを取得
          const existingNos = Object.values(savedEmployees)
            .map((emp: any) => emp.no || 0)
            .filter((no: number) => !isNaN(no));
          
          // 最大のNo値を検索
          const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0;
          
          // 次のno番号を生成 (最大値 + 1)
          const nextNo = maxNo + 1;
          
          console.log(`新規従業員のNo生成: 既存No=${existingNos.join(',')}, 最大No=${maxNo}, 次のNo=${nextNo}`);
          
          const newEmployee = {
            ...employeeData,
            id: customId,
            no: nextNo, // 連番のNo値を設定
            fiscal_year: year,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // サンプルと区別するためのフラグ
            isCustom: true
          };
          
          // 新しい従業員データをログ出力（デバッグ用）
          console.log(`新規作成する従業員データ:`, newEmployee);
          
          // 既存のデータに新しい従業員を追加
          savedEmployees = {
            ...savedEmployees,
            [customId]: newEmployee
          };
          
          // ローカルストレージに保存
          localStorage.setItem(storageKey, JSON.stringify(savedEmployees));
          console.log(`新規従業員ID=${customId}のデータをローカルストレージに保存しました`);
          
          // モックレスポンスを返す - 実際のAPIレスポンス形式に合わせる
          return {
            success: true,
            message: '従業員データをクライアント側で作成しました',
            employee: newEmployee // 完全なオブジェクトを返す
          };
        } catch (storageError) {
          console.error('ローカルストレージへの保存エラー:', storageError);
          throw storageError; // エラーを再スローして上位でキャッチできるようにする
        }
      }
      
      // 実際のAPI呼び出し（2023年以前のデータ）
      try {
        const response = await fetch(`/api/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            ...data,
            fiscal_year: year,
            // 月次ステータスが未定義の場合は空の配列を設定
            monthlyStatus: data.monthlyStatus || Array(12).fill('')
          }),
        });
        
        // 共通の安全なレスポンス処理を使用
        const responseData = await reportApi.safeResponseParser(response);
        return responseData;
      } catch (apiError) {
        console.error(`API呼び出しエラー: ${apiError}`);
        
        // 2023年以前のデータではAPIエラーを再スロー
        if (year < 2024) {
          throw apiError;
        }
        
        // 2024年以降のデータの場合は、APIエラーが発生してもクライアント側でデータを作成
        console.warn(`APIエラーが発生しましたが、${year}年のデータはクライアント側で作成します`);
        
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 1000);
        const tempId = parseInt(`${timestamp % 100000}${randomPart}`.substring(0, 6));
        
        return {
          success: true,
          message: 'データベース接続エラーが発生しましたが、クライアント側でデータを作成しました',
          employee: {
            ...data,
            id: tempId,
            fiscal_year: year,
            monthlyStatus: data.monthlyStatus || Array(12).fill('')
          }
        };
      }
    } catch (error) {
      console.error(`従業員作成エラー: ${error}`);
      
      // 2024年以降のデータの場合は、エラーをスローする代わりにモックレスポンスを返す
      if (year >= 2024) {
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 1000);
        const tempId = parseInt(`${timestamp % 100000}${randomPart}`.substring(0, 6));
        
        console.log(`エラーが発生しましたが、${year}年のデータはクライアント側で作成します`);
        
        return {
          success: true,
          message: 'データベース接続エラーが発生しましたが、クライアント側でデータを作成しました',
          employee: {
            ...data,
            id: tempId,
            fiscal_year: year,
            monthlyStatus: data.monthlyStatus || Array(12).fill('')
          }
        };
      }
      
      throw error;
    }
  },

  // 従業員データを削除（実装済みエンドポイントを使用）
  deleteEmployeeData: async (year: number, employeeId: number) => {
    console.log(`${year}年の従業員ID:${employeeId}を削除しています...`);
    try {
      // 2024年以降のデータは特別処理 - クライアント側での削除のみ
      if (year >= 2024) {
        console.log(`${year}年の従業員データはクライアント側で削除します（APIは呼び出しません）`);
        
        // 将来的に、ローカルストレージから削除する機能を追加可能
        
        return {
          success: true,
          message: '従業員データをクライアント側で削除しました'
        };
      }
      
      // 実際のAPI呼び出し（2023年以前のデータ）
      const response = await fetch(`/api/employees/${employeeId}?fiscal_year=${year}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // 共通の安全なレスポンス処理を使用
      const responseData = await reportApi.safeResponseParser(response);
      return responseData;
    } catch (error) {
      console.error(`従業員削除エラー: ${error}`);
      
      // 2024年以降のデータの場合は、エラーをスローする代わりに成功レスポンスを返す
      if (year >= 2024) {
        console.log(`エラーが発生しましたが、${year}年の従業員はクライアント側で削除します`);
        
        return {
          success: true,
          message: 'データベース接続エラーが発生しましたが、クライアント側で削除しました'
        };
      }
      
      throw error;
    }
  },

  handleApiError: (error: any): string => {
    // HTML応答のエラー（Expressサーバーのクラッシュやプロキシエラーなど）
    if (error.message && error.message.includes('APIがHTMLを返しました')) {
      return 'サーバーエラーが発生しました。管理者に連絡してください。';
    }
    
    // 500エラー（サーバー内部エラー）
    if (error.message && error.message.includes('API error: 500')) {
      return 'サーバー内部エラーが発生しました。しばらく待ってから再試行してください。';
    }
    
    // 404エラー（リソースが見つからない）
    if (error.message && error.message.includes('API error: 404')) {
      return '指定されたデータが見つかりません。データが削除されたか、権限がない可能性があります。';
    }
    
    // 401/403エラー（認証/認可エラー）
    if (error.message && (error.message.includes('API error: 401') || error.message.includes('API error: 403'))) {
      return '権限がないか、セッションが期限切れになっています。再ログインしてください。';
    }
    
    // 400エラー（不正なリクエスト）
    if (error.message && error.message.includes('API error: 400')) {
      return '入力データに問題があります。入力内容を確認してください。';
    }
    
    // ネットワーク関連エラー
    if (error.message && error.message.includes('Network Error')) {
      return 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
    }
    
    // タイムアウトエラー
    if (error.message && error.message.includes('timeout')) {
      return 'リクエストがタイムアウトしました。サーバーが混雑しているか、ネットワーク速度が遅い可能性があります。';
    }
    
    // 2024年以降特有のエラー
    if (error.message && error.message.includes('2024年以降のデータ')) {
      return '将来年度のデータのため、現在はローカルで処理されています。';
    }
    
    // JSON解析エラー
    if (error.message && (error.message.includes('JSON') || error.message.includes('解析'))) {
      return 'データ形式エラーが発生しました。管理者に連絡してください。';
    }
    
    // その他のエラー
    return `エラーが発生しました: ${error.message || '不明なエラー'}`;
  }
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
  onEmployeesUpdate?: (employees: Employee[]) => void; // 親コンポーネントに変更を通知するコールバック
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
  hc: 1, // デフォルトのHC値を1に設定
  monthlyStatus: Array(12).fill(''),
  memo: '',
  count: 0
};

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
  onYearChange,
  onEmployeesUpdate
}) => {
  console.log('EmployeesTab マウント - 受け取った従業員データ:', employees);
  
  // 年月コンテキストから現在の年と月を取得
  const { fiscalYear, month, setFiscalYear } = useYearMonth();
  
  // 内部編集状態
  const [internalIsEditing, setInternalIsEditing] = useState<boolean>(false);
  
  // 実際に使用する編集状態
  const actualIsEditing = isEditing || internalIsEditing;
  
  // ローカルの従業員データ
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  
  // 元の従業員データを保持するための状態（編集キャンセル用）
  const [originalEmployees, setOriginalEmployees] = useState<Employee[]>([]);
  
  // 選択状態の管理
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  
  // 新規行追加モード用の状態
  const [isAddingNewRow, setIsAddingNewRow] = useState<boolean>(false);
  const [newRowData, setNewRowData] = useState<Omit<Employee, 'id'>>({...defaultEmployee});
  
  // エラーメッセージ状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 成功メッセージ状態
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // CSVインポートモーダルの状態
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState<boolean>(false);

  // 入力状態管理用のローカルstate
  const [inputValues, setInputValues] = useState<{[key: string]: any}>({});

  // 月名の配列
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
  
  // 月番号の配列（会計年度順）
  const monthNumbers = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

  // 入力フィールドの参照を保持
  const inputRefs = useRef<{[key: string]: HTMLInputElement | HTMLSelectElement | null}>({});

  // キーボードナビゲーションハンドラー
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, currentId: string) => {
    const { key } = event;
    
    // 矢印キーが押された場合
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
      event.preventDefault(); // デフォルトのタブ移動を防止
      
      // 現在の入力要素のIDから、行、列情報を解析
      const [idPart, fieldPart] = currentId.split('-');
      
      // 移動先の要素IDを決定
      let nextId = '';
      
      // 月次ステータスフィールドかどうかの判定
      const isMonthlyField = fieldPart && fieldPart.startsWith('monthlyStatus');
      const currentMonthIndex = isMonthlyField ? parseInt(fieldPart.split('-')[1]) : -1;
      
      const employeeIds = localEmployees.map(emp => emp.id.toString());
      const newRowIdPrefix = 'new';
      const isNewRow = idPart === newRowIdPrefix;
      
      // フィールド順序（月次ステータス以外）
      const fieldsOrder = ['employee_id', 'name', 'disability_type', 'disability', 'grade', 'hire_date', 'status', 'memo'];
      
      switch (key) {
        case 'ArrowUp':
          if (isMonthlyField) {
            // 上の従業員の同じ月フィールドに移動
            const currentIdIndex = isNewRow 
              ? localEmployees.length 
              : employeeIds.indexOf(idPart);
              
            if (currentIdIndex > 0) {
              // 上の行の同じ月フィールドに移動
              nextId = `${employeeIds[currentIdIndex - 1]}-monthlyStatus-${currentMonthIndex}`;
            }
          } else {
            // 上の従業員の同じフィールドに移動
            const currentIdIndex = isNewRow 
              ? localEmployees.length 
              : employeeIds.indexOf(idPart);
              
            if (currentIdIndex > 0) {
              // 上の行の同じフィールドに移動
              nextId = `${employeeIds[currentIdIndex - 1]}-${fieldPart}`;
            }
          }
          break;
          
        case 'ArrowDown':
          if (isMonthlyField) {
            // 下の従業員の同じ月フィールドに移動
            const currentIdIndex = isNewRow 
              ? localEmployees.length 
              : employeeIds.indexOf(idPart);
              
            if (currentIdIndex < localEmployees.length - 1) {
              // 下の行の同じ月フィールドに移動
              nextId = `${employeeIds[currentIdIndex + 1]}-monthlyStatus-${currentMonthIndex}`;
            } else if (currentIdIndex === localEmployees.length - 1 && isAddingNewRow) {
              // 新規行の同じ月フィールドに移動
              nextId = `new-monthlyStatus-${currentMonthIndex}`;
            }
          } else {
            // 下の従業員の同じフィールドに移動
            const currentIdIndex = isNewRow 
              ? localEmployees.length 
              : employeeIds.indexOf(idPart);
              
            if (currentIdIndex < localEmployees.length - 1) {
              // 下の行の同じフィールドに移動
              nextId = `${employeeIds[currentIdIndex + 1]}-${fieldPart}`;
            } else if (currentIdIndex === localEmployees.length - 1 && isAddingNewRow) {
              // 新規行の同じフィールドに移動
              nextId = `new-${fieldPart}`;
            }
          }
          break;
          
        case 'ArrowLeft':
          if (isMonthlyField) {
            // 左の月フィールドに移動
            if (currentMonthIndex > 0) {
              nextId = `${idPart}-monthlyStatus-${currentMonthIndex - 1}`;
            } else {
              // 月次ステータスの最初の列から左に移動する場合は通常フィールドの最後へ
              nextId = `${idPart}-status`;
            }
          } else {
            // 通常フィールドの場合、左のフィールドに移動
            const currentFieldIndex = fieldsOrder.indexOf(fieldPart);
            if (currentFieldIndex > 0) {
              nextId = `${idPart}-${fieldsOrder[currentFieldIndex - 1]}`;
            }
          }
          break;
          
        case 'ArrowRight':
        case 'Tab':
          if (isMonthlyField) {
            // 右の月フィールドに移動
            if (currentMonthIndex < 11) {
              nextId = `${idPart}-monthlyStatus-${currentMonthIndex + 1}`;
            } else {
              // 月次ステータスの最後の列から右に移動する場合はメモフィールドへ
              nextId = `${idPart}-memo`;
            }
          } else {
            // 通常フィールドの場合、右のフィールドに移動
            const currentFieldIndex = fieldsOrder.indexOf(fieldPart);
            if (currentFieldIndex < fieldsOrder.length - 1) {
              nextId = `${idPart}-${fieldsOrder[currentFieldIndex + 1]}`;
            } else if (currentFieldIndex === fieldsOrder.length - 1) {
              // メモフィールドの次は月次ステータスの最初へ
              nextId = `${idPart}-monthlyStatus-0`;
            }
          }
          break;
      }
      
      // 次の入力フィールドにフォーカスを移す
      if (nextId && inputRefs.current[nextId]) {
        inputRefs.current[nextId]?.focus();
      }
    }
  }, [localEmployees, isAddingNewRow]);

  // 前年度の在籍中の従業員データを現在の年度にコピーする関数
  const copyActiveEmployeesFromPreviousYear = async (currentYear: number): Promise<number> => {
    try {
      // 前年度のStorageKeyを生成
      const prevYear = currentYear - 1;
      const prevYearStorageKey = `EMPLOYEE_DATA_${prevYear}`;
      
      // 現在の年度のStorageKeyを生成
      const currentYearStorageKey = `EMPLOYEE_DATA_${currentYear}`;
      
      // 現在の年度のデータを取得
      let currentYearData: Record<string, any> = {};
      try {
        const savedCurrentYearData = localStorage.getItem(currentYearStorageKey);
        if (savedCurrentYearData) {
          currentYearData = JSON.parse(savedCurrentYearData);
        }
      } catch (e) {
        console.error('現在年度のデータ読み取りエラー:', e);
      }
      
      // 前年度のデータが存在するか確認
      const savedPrevYearData = localStorage.getItem(prevYearStorageKey);
      if (!savedPrevYearData) {
        console.log(`${prevYear}年のデータが存在しないため、引き継ぐデータはありません`);
        return 0;
      }
      
      try {
        // 前年度のデータを解析
        const prevYearEmployees = JSON.parse(savedPrevYearData);
        
        // 在籍中または休職中の従業員のみをフィルタリング
        const activeEmployees = Object.values(prevYearEmployees).filter((emp: any) => 
          emp.status === '在籍' || emp.status === '休職'
        );
        
        if (activeEmployees.length === 0) {
          console.log(`${prevYear}年に在籍中または休職中の従業員がいないため、引き継ぐデータはありません`);
          return 0;
        }
        
        // 在籍中の従業員を現在の年度にコピー
        let newEmployeesCount = 0;
        
        // 最初に、現在の年度のデータから最大IDを見つける
        const existingIds = Object.keys(currentYearData).map(id => parseInt(id));
        let nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 10000; // 新しいIDの開始点
        
        // 在籍中の従業員を現在の年度にコピー
        activeEmployees.forEach((emp: any) => {
          // IDの衝突を避けるための新しいID生成
          const newId = nextId++;
          
          // 従業員データを新しい年度用にコピー
          const copiedEmployee = {
            ...emp,
            id: newId,
            fiscal_year: currentYear,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 現在の年度のデータに追加
          currentYearData[newId] = copiedEmployee;
          newEmployeesCount++;
        });
        
        // 更新されたデータをローカルストレージに保存
        if (newEmployeesCount > 0) {
          localStorage.setItem(currentYearStorageKey, JSON.stringify(currentYearData));
          console.log(`${prevYear}年から${currentYear}年へ${newEmployeesCount}件の従業員データを引き継ぎました`);
          return newEmployeesCount;
        }
      } catch (e) {
        console.error('データの引き継ぎ中にエラーが発生しました:', e);
      }
    } catch (error) {
      console.error('従業員データの引き継ぎ中にエラーが発生しました:', error);
    }
    
    return 0;
  };

  // 年度変更時に従業員データを取得する関数
  const fetchEmployeesByYear = useCallback(async (year: number) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`${year}年の従業員データを取得中...`);
      
      // 2024年以降のデータで、ローカルストレージを先にチェック
      if (year >= 2024) {
        const storageKey = `EMPLOYEE_DATA_${year}`;
        try {
          const savedData = localStorage.getItem(storageKey);
          
          if (savedData) {
            // localStorage にデータが存在する場合は、それを優先して使用
            const savedEmployees = JSON.parse(savedData);
            
            // オブジェクトから配列に変換
            const employeesArray = Object.values(savedEmployees);
            
            if (employeesArray.length > 0) {
              console.log(`${year}年の従業員データをローカルストレージから読み込みました:`, employeesArray.length, '件');
              
              const processedEmployees = employeesArray.map((emp: any) => ({
                ...emp,
                employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
                disability_type: emp.disability_type || '',
                disability: emp.disability || '',
                grade: emp.grade || '',
                status: emp.status || '在籍',
                hc: emp.hc !== undefined ? emp.hc : 1,
                monthlyStatus: Array.isArray(emp.monthlyStatus) ? emp.monthlyStatus : Array(12).fill('')
              }));
              
              setLocalEmployees(processedEmployees);
              setOriginalEmployees(JSON.parse(JSON.stringify(processedEmployees)));
              
              setSuccessMessage(`${year}年のデータを読み込みました（${processedEmployees.length}件）`);
              setTimeout(() => setSuccessMessage(null), 3000);
              
              setIsLoading(false);
              return;
            }
          }
          
          // データが存在しない場合、前年度からデータを引き継ぐ
          if (!savedData || (savedData && Object.keys(JSON.parse(savedData) || {}).length === 0)) {
            console.log(`${year}年のデータが存在しないため、前年度からデータを引き継ぎを試みます`);
            
            // 前年度からデータを引き継ぐ
            const copiedCount = await copyActiveEmployeesFromPreviousYear(year) || 0;
            
            if (copiedCount > 0) {
              // 引き継ぎに成功した場合、改めてローカルストレージから読み込み直す
              const updatedData = localStorage.getItem(storageKey);
              if (updatedData) {
                const updatedEmployees = JSON.parse(updatedData);
                const updatedArray = Object.values(updatedEmployees);
                
                if (updatedArray.length > 0) {
                  const processedEmployees = updatedArray.map((emp: any) => ({
                    ...emp,
                    employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
                    disability_type: emp.disability_type || '',
                    disability: emp.disability || '',
                    grade: emp.grade || '',
                    status: emp.status || '在籍',
                    hc: emp.hc !== undefined ? emp.hc : 1,
                    monthlyStatus: Array.isArray(emp.monthlyStatus) ? emp.monthlyStatus : Array(12).fill('')
                  }));
                  
                  setLocalEmployees(processedEmployees);
                  setOriginalEmployees(JSON.parse(JSON.stringify(processedEmployees)));
                  
                  setSuccessMessage(`前年度から${copiedCount}件の従業員データを引き継ぎました`);
                  setTimeout(() => setSuccessMessage(null), 3000);
                  
                  setIsLoading(false);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.error('ローカルストレージ読み取りエラー:', e);
        }
      }
      
      // ローカルストレージにデータがない場合のみAPIから取得（2024年以降は空データが返される可能性が高い）
      const response = await reportApi.getEmployeesByYear(year);
      
      if (response?.data?.employees) {
        console.log(`${year}年の従業員データを取得成功:`, response.data.employees);
        
        // データの有無を確認
        if (!Array.isArray(response.data.employees) || response.data.employees.length === 0) {
          console.log(`${year}年のAPIデータは空です。空の配列を使用します。`);
          setLocalEmployees([]);
          setOriginalEmployees([]);
          setSuccessMessage(`${year}年のデータがまだ作成されていません。新規追加ができます。`);
          setTimeout(() => setSuccessMessage(null), 3000);
          setIsLoading(false);
          return;
        }
        
        const processedEmployees = response.data.employees.map((emp: any) => ({
          ...emp,
          employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
          disability_type: emp.disability_type || '',
          disability: emp.disability || '',
          grade: emp.grade || '',
          status: emp.status || '在籍',
          hc: emp.hc !== undefined ? emp.hc : 1, // HCが未定義の場合は1をデフォルト値に設定
          monthlyStatus: (() => {
            if (Array.isArray(emp.monthlyStatus)) {
              return emp.monthlyStatus;
            } else if (typeof emp.monthly_status === 'string') {
              try {
                return JSON.parse(emp.monthly_status);
              } catch (e) {
                return Array(12).fill('');
              }
            } else {
              return Array(12).fill('');
            }
          })()
        }));
        
        setLocalEmployees(processedEmployees);
        setOriginalEmployees(JSON.parse(JSON.stringify(processedEmployees)));
        
        if (processedEmployees.length > 0) {
          setSuccessMessage(`${year}年のデータを読み込みました（${processedEmployees.length}件）`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        console.log(`${year}年の従業員データは空です`);
        setLocalEmployees([]);
        setOriginalEmployees([]);
        setSuccessMessage(`${year}年のデータがまだ作成されていません。新規追加ができます。`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      console.error(`${year}年の従業員データ取得エラー:`, error);
      // このエラーは発生しないはず (getEmployeesByYearでキャッチされる)
      setErrorMessage(`予期せぬエラーが発生しました。管理者に連絡してください。`);
      setLocalEmployees([]);
      setOriginalEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useRefを通常のコンポーネントスコープで宣言（Hookのルールに従う）
  const isInitialRender = useRef(true);
  
  // fiscalYear変更時のデータ読み込み処理
  useEffect(() => {
    // fiscalYearが変更されたときのみ実行するために、先にフラグをチェック
    console.log(`fiscalYear変更を検知: ${fiscalYear}`);
    
    // データロード処理
    const loadDataForFiscalYear = async () => {
      // 統一されたストレージキー
      const storageKey = `EMPLOYEE_DATA_${fiscalYear}`;
      console.log('=== データロード開始 ===');
      console.log('ローカルストレージから読み込み試行 - キー:', storageKey);
      
      try {
        // 古いキーと新しいキーの両方をチェック
        const allKeys = Object.keys(localStorage);
        const legacyKey = `employee_data_${fiscalYear}`;
        let savedData = localStorage.getItem(storageKey);
        
        // 新しいキーで見つからなければ古いキーを確認
        if (!savedData && allKeys.includes(legacyKey)) {
          console.log(`古いフォーマットのキー ${legacyKey} からデータを読み込みます`);
          savedData = localStorage.getItem(legacyKey);
          
          // データが見つかれば新しいキーに移行
          if (savedData) {
            console.log('古いキーから新しいキーにデータを移行します');
            localStorage.setItem(storageKey, savedData);
            // 安全を確保するために今は古いキーは削除しない
          }
        }
        
        console.log('取得されたデータ有無:', savedData ? 'あり' : 'なし');
        if (savedData) {
          const savedEmployees = JSON.parse(savedData);
          // オブジェクトから配列に変換
          const employeesArray = Object.values(savedEmployees);
          
          if (employeesArray.length > 0) {
            console.log(`${fiscalYear}年の${employeesArray.length}件のデータを読み込みました`);
            
            const processedEmployees = employeesArray.map((emp: any) => ({
              ...emp,
              employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
              disability_type: emp.disability_type || '',
              disability: emp.disability || '',
              grade: emp.grade || '',
              status: emp.status || '在籍',
              hc: emp.hc !== undefined ? emp.hc : 1,
              monthlyStatus: Array.isArray(emp.monthlyStatus) ? emp.monthlyStatus : Array(12).fill('')
            }));
            
            setLocalEmployees(processedEmployees);
            setOriginalEmployees(JSON.parse(JSON.stringify(processedEmployees)));
            
            // 親コンポーネントにデータ変更を通知
            if (onEmployeesUpdate) {
              console.log('親コンポーネントに年度変更後のデータを通知:', processedEmployees.length, '件');
              onEmployeesUpdate(processedEmployees);
            }
            
            setSuccessMessage(`${fiscalYear}年のデータを読み込みました（${processedEmployees.length}件）`);
            setTimeout(() => setSuccessMessage(null), 3000);
            
            return true; // データが見つかった場合はtrueを返す
          }
        }
        return false; // データが見つからなかった場合はfalseを返す
      } catch (e) {
        console.error('fiscalYear変更時のデータ読み込みエラー:', e);
        return false;
      }
    };
    
    // 実際のデータロード処理の実行
    loadDataForFiscalYear().then(foundInLocalStorage => {
      if (!foundInLocalStorage) {
        console.log('ローカルストレージにデータが見つからないため、別の取得方法を試みます');
        
        // 2024年以降の場合は前年度からのデータ引き継ぎも試行
        if (fiscalYear >= 2024) {
          copyActiveEmployeesFromPreviousYear(fiscalYear).then(copiedCount => {
            if (copiedCount > 0) {
              console.log(`前年度から${copiedCount}件のデータを引き継ぎました`);
              // 再度ローカルストレージから読み込む
              loadDataForFiscalYear().then(success => {
                if (!success) {
                  // それでも読み込めない場合はAPIから取得
                  fetchEmployeesByYear(fiscalYear);
                }
              });
            } else {
              // コピーできなかった場合はAPIから取得
              fetchEmployeesByYear(fiscalYear);
            }
          });
        } else {
          // 2023年以前のデータはAPIから取得
          fetchEmployeesByYear(fiscalYear);
        }
      }
    });
  }, [fiscalYear]); // fiscalYearが変わったときにのみ実行

  // 従業員データ自動引き継ぎ関数
  const inheritEmployeeData = (employee: Employee, fromYear: number, toYear: number): Employee | null => {
    console.log(`従業員 ID=${employee.id}, 名前=${employee.name} のデータ引き継ぎ処理を開始`);
    
    // 状態チェック - 在籍状態でない場合は引き継がない
    if (employee.status !== '在籍') {
      console.log(`従業員 ID=${employee.id} の状態が「在籍」ではないため (${employee.status})、引き継ぎません`);
      return null;
    }
    
    // 採用日のチェック
    if (!employee.hire_date) {
      console.log(`従業員 ID=${employee.id} の採用日が未設定のため、引き継ぎません`);
      return null;
    }
    
    const hireDateParts = employee.hire_date.split('/');
    if (hireDateParts.length !== 3) {
      console.log(`従業員 ID=${employee.id} の採用日 ${employee.hire_date} のフォーマットが不正です`);
      return null;
    }
    
    const hireYear = parseInt(hireDateParts[0]);
    const hireMonth = parseInt(hireDateParts[1]);
    const hireDay = parseInt(hireDateParts[2]);
    
    console.log(`採用日: ${hireYear}/${hireMonth}/${hireDay}, 引継元年度: ${fromYear}, 引継先年度: ${toYear}`);
    
    // 新しい年度のデータを作成
    const newEmployee: Employee = {
      ...employee,
      fiscal_year: toYear, // 年度を更新
      inheritedFrom: fromYear, // 引き継ぎ元情報を追加
      _timestamp: new Date().toISOString() // タイムスタンプ更新
    };
    
    console.log(`${toYear}年度に従業員 ID=${employee.id} のデータを引き継ぎました`);
    return newEmployee;
  };
  
  // 全従業員データの一括引き継ぎ処理
  const bulkInheritEmployeeData = (employees: Employee[], fromYear: number, toYear: number) => {
    console.log(`\n===== ${fromYear}年度から${toYear}年度への一括引き継ぎ処理 =====`);
    
    const inheritedEmployees: Employee[] = [];
    const skippedEmployees: {id: number, name: string, reason: string}[] = [];
    
    employees.forEach(employee => {
      const inheritedEmployee = inheritEmployeeData(employee, fromYear, toYear);
      
      if (inheritedEmployee) {
        inheritedEmployees.push(inheritedEmployee);
      } else {
        skippedEmployees.push({
          id: employee.id,
          name: employee.name,
          reason: "状態が在籍でないか、採用日が無効"
        });
      }
    });
    
    console.log(`引き継ぎ結果: 成功=${inheritedEmployees.length}件, スキップ=${skippedEmployees.length}件`);
    return {
      inheritedEmployees,
      skippedEmployees
    };
  };
  
  // 改良版データ引き継ぎ機能
  const checkAndInheritEmployeeData = (fromYear: number, toYear: number) => {
    console.log(`改良版従業員データの引き継ぎチェック開始: ${fromYear} → ${toYear}`);
    
    // 前年度のデータを取得
    const fromKey = `EMPLOYEE_DATA_${fromYear}`;
    const fromData = localStorage.getItem(fromKey);
    
    if (!fromData) {
      console.log(`${fromYear}年度のデータが見つかりません`);
      return { success: false, message: `${fromYear}年度のデータが見つかりません` };
    }
    
    // 対象年度のデータを確認
    const toKey = `EMPLOYEE_DATA_${toYear}`;
    const toData = localStorage.getItem(toKey);
    
    // データ形式を判定して処理
    try {
      // 前年度データを解析
      const isFromObject = fromData.trim().startsWith('{');
      let fromEmployees: any[] = [];
      
      if (isFromObject) {
        // オブジェクト形式の場合
        const fromEmployeeObj = JSON.parse(fromData);
        fromEmployees = Object.values(fromEmployeeObj);
      } else {
        // 配列形式の場合
        fromEmployees = JSON.parse(fromData);
      }
      
      console.log(`${fromYear}年度の従業員数: ${fromEmployees.length}`);
      
      // 対象年度データを解析
      let toEmployees: any[] = [];
      let toEmployeeObj: Record<string, any> = {};
      
      if (toData) {
        const isToObject = toData.trim().startsWith('{');
        
        if (isToObject) {
          toEmployeeObj = JSON.parse(toData);
          toEmployees = Object.values(toEmployeeObj);
        } else {
          toEmployees = JSON.parse(toData);
          
          // 配列からオブジェクトに変換
          toEmployees.forEach(emp => {
            if (emp && emp.id) {
              toEmployeeObj[emp.id] = emp;
            }
          });
        }
        
        console.log(`${toYear}年度の従業員数: ${toEmployees.length}`);
      } else {
        console.log(`${toYear}年度のデータは存在しません。新規作成します。`);
      }
      
      // 前年度の在籍者をフィルタリング
      const activeEmployees = fromEmployees.filter(emp => {
        // 状態が「在籍」かを確認（複数の表記に対応）
        return emp.status === '在籍' || 
               emp.status === '雇用継続' || 
               emp.employmentStatus === '在籍';
      });
      
      console.log(`引き継ぎ対象（在籍者）数: ${activeEmployees.length}`);
      
      // 引き継ぎ処理
      const inheritedEmployees: any[] = [];
      const skippedEmployees: any[] = [];
      
      activeEmployees.forEach(emp => {
        // IDの重複チェック
        const employeeId = emp.id;
        const exists = toEmployeeObj[employeeId] !== undefined;
        
        if (exists) {
          console.log(`従業員ID=${employeeId}, 名前=${emp.name || '名前なし'} は既に${toYear}年度に存在するためスキップします`);
          skippedEmployees.push({
            id: employeeId,
            name: emp.name || '名前なし',
            reason: '既に存在'
          });
          return;
        }
        
        // 引き継ぎデータの作成
        const inheritedEmployee = {
          ...emp,
          fiscal_year: toYear,
          inheritedFrom: fromYear,
          _timestamp: new Date().toISOString()
        };
        
        // 月次データをリセット
        if (inheritedEmployee.monthlyStatus) {
          inheritedEmployee.monthlyStatus = Array(12).fill('');
        }
        
        inheritedEmployees.push(inheritedEmployee);
        toEmployeeObj[employeeId] = inheritedEmployee;
      });
      
      // 対象年度のデータを保存
      if (inheritedEmployees.length > 0) {
        localStorage.setItem(toKey, JSON.stringify(toEmployeeObj));
        console.log(`${toYear}年度に${inheritedEmployees.length}件のデータを引き継ぎました`);
      }
      
      return {
        success: true,
        inheritedCount: inheritedEmployees.length,
        skippedCount: skippedEmployees.length,
        message: `${fromYear}年度から${toYear}年度へ${inheritedEmployees.length}件のデータを引き継ぎました（${skippedEmployees.length}件はスキップされました）`
      };
      
    } catch (error) {
      console.error(`データ引き継ぎ処理でエラーが発生しました:`, error);
      return { 
        success: false, 
        message: `データ引き継ぎ処理でエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  };
  
  // 手動でデータ引き継ぎを実行する関数
  const manualInheritData = (fromYear: number, toYear: number) => {
    // バックアップの作成
    try {
      const fromKey = `EMPLOYEE_DATA_${fromYear}`;
      const toKey = `EMPLOYEE_DATA_${toYear}`;
      
      localStorage.setItem(`${fromKey}_BACKUP`, localStorage.getItem(fromKey) || '');
      localStorage.setItem(`${toKey}_BACKUP`, localStorage.getItem(toKey) || '');
      
      console.log(`バックアップを作成しました: ${fromKey}_BACKUP, ${toKey}_BACKUP`);
    } catch (error) {
      console.error(`バックアップ作成中にエラーが発生しました:`, error);
    }
    
    // データ引き継ぎの実行
    const result = checkAndInheritEmployeeData(fromYear, toYear);
    
    if (result.success) {
      setSuccessMessage(result.message);
      // データの再読み込み
      fetchEmployeesByYear(fiscalYear);
    } else {
      setErrorMessage(result.message);
    }
    
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 5000);
    
    return result;
  };

  // 従業員データをDBから削除するスクリプト
  
  // 1. 削除対象の従業員を確認する関数
  const checkEmployeeToDelete = async (employeeId: number) => {
    console.log("=== 削除対象の従業員確認 ===");
    
    try {
      // 現在選択中の年度のデータを確認
      const storageKey = `EMPLOYEE_DATA_${fiscalYear}`;
      const allData = localStorage.getItem(storageKey);
      
      if (!allData) {
        console.log(`${fiscalYear}年度のデータが見つかりません`);
        return null;
      }
      
      // データ形式に応じて処理
      let employeeData: any = null;
      const isObject = allData.trim().startsWith('{');
      
      if (isObject) {
        const data = JSON.parse(allData);
        employeeData = data[employeeId];
      } else {
        const data = JSON.parse(allData);
        employeeData = data.find((emp: any) => emp.id === employeeId);
      }
      
      if (!employeeData) {
        console.log(`従業員ID=${employeeId}が見つかりません`);
        return null;
      }
      
      // 詳細ログ出力
      console.log("=== 削除対象の従業員 ===");
      console.log({
        ID: employeeData.id,
        名前: employeeData.name,
        社員ID: employeeData.employee_id,
        障害区分: employeeData.disability_type,
        状態: employeeData.status,
        採用日: employeeData.hire_date
      });
      
      return employeeData;
    } catch (error) {
      console.error("従業員確認エラー:", error);
      return null;
    }
  };
  
  // 2. 従業員データの削除を実行する関数
  const deleteEmployeeFromDB = async (employeeId: number) => {
    console.log(`\n=== 従業員ID ${employeeId} の削除処理を開始 ===`);
    
    try {
      // まずはバックアップを作成
      const backupResult = await createEmployeeBackup(employeeId);
      if (!backupResult.success) {
        return backupResult;
      }
      
      // トランザクション相当の処理 - まず関連データを確認
      
      // 関連する月次データを確認
      const hasRelatedMonthlyData = await checkRelatedMonthlyData(employeeId);
      console.log(`関連する月次データ: ${hasRelatedMonthlyData ? 'あり' : 'なし'}`);
      
      // 削除前にログを出力
      const employeeToDelete = await checkEmployeeToDelete(employeeId);
      if (!employeeToDelete) {
        return {
          success: false,
          message: `従業員ID=${employeeId}が見つかりません`
        };
      }
      
      // DBからデータを削除
      const deleteResult = await reportApi.deleteEmployeeData(fiscalYear, employeeId);
      console.log("API削除結果:", deleteResult);
      
      if (deleteResult && deleteResult.success) {
        // LocalStorageからも削除
        await deleteEmployeeFromLocalStorage(employeeId);
        
        // UIの更新（既存の機能を使用）
        setLocalEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        setOriginalEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        
        return {
          success: true,
          message: `従業員ID=${employeeId}を削除しました`,
          backupPath: backupResult.backupPath
        };
      }
      
      return {
        success: false,
        message: "削除処理に失敗しました"
      };
      
    } catch (error) {
      console.error("削除エラー:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
  
  // 3. LocalStorageから従業員データを削除する関数
  const deleteEmployeeFromLocalStorage = async (employeeId: number) => {
    try {
      const storageKey = `EMPLOYEE_DATA_${fiscalYear}`;
      const data = localStorage.getItem(storageKey);
      
      if (!data) {
        console.log(`${fiscalYear}年度のデータが見つかりません`);
        return false;
      }
      
      // データ形式に応じて処理
      const isObject = data.trim().startsWith('{');
      
      if (isObject) {
        // オブジェクト形式
        const employeeData = JSON.parse(data);
        if (employeeData[employeeId]) {
          // 該当する従業員データを削除
          delete employeeData[employeeId];
          localStorage.setItem(storageKey, JSON.stringify(employeeData));
          console.log(`LocalStorage(オブジェクト形式)から従業員ID=${employeeId}を削除しました`);
          return true;
        }
      } else {
        // 配列形式
        const employeeData = JSON.parse(data);
        const filteredData = employeeData.filter((emp: any) => emp.id !== employeeId);
        localStorage.setItem(storageKey, JSON.stringify(filteredData));
        console.log(`LocalStorage(配列形式)から従業員ID=${employeeId}を削除しました`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("LocalStorage削除エラー:", error);
      return false;
    }
  };
  
  // 4. 関連する月次データをチェックする関数
  const checkRelatedMonthlyData = async (employeeId: number) => {
    try {
      // 仮の実装 - 実際にはMonthlyReportデータを確認する
      console.log(`従業員ID=${employeeId}の関連月次データをチェック`);
      
      const storageKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('MONTHLY_REPORT_') || key.startsWith('PAYMENT_REPORT_'));
      
      for (const key of storageKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          if (data.includes(`"employee_id":${employeeId}`) || 
              data.includes(`"employeeId":${employeeId}`) || 
              data.includes(`"id":${employeeId}`)) {
            console.log(`関連データが見つかりました: ${key}`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("関連データチェックエラー:", error);
      return false;
    }
  };
  
  // 5. 従業員データのバックアップを作成する関数
  const createEmployeeBackup = async (employeeId: number) => {
    try {
      const employeeData = await checkEmployeeToDelete(employeeId);
      if (!employeeData) {
        return {
          success: false,
          message: `従業員ID=${employeeId}が見つかりません`
        };
      }
      
      // バックアップキーの生成
      const timestamp = new Date().getTime();
      const backupKey = `EMPLOYEE_BACKUP_${employeeId}_${fiscalYear}_${timestamp}`;
      
      // バックアップの保存
      localStorage.setItem(backupKey, JSON.stringify(employeeData));
      console.log(`バックアップを作成しました: ${backupKey}`);
      
      return {
        success: true,
        message: `従業員ID=${employeeId}のバックアップを作成しました`,
        backupPath: backupKey
      };
    } catch (error) {
      console.error("バックアップ作成エラー:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
  
  // 6. 複数従業員の削除（必要な場合）
  const deleteMultipleEmployees = async (employeeIds: number[]) => {
    console.log(`\n=== ${employeeIds.length}人の従業員削除処理 ===`);
    
    // 結果を格納する配列に明示的な型を定義
    type DeleteResult = {
      id: number;
      success: boolean;
      message?: string;
      error?: string;
      backupPath?: string;
    };
    
    const results: DeleteResult[] = [];
    
    for (const id of employeeIds) {
      console.log(`\n--- 従業員ID=${id}の削除処理 ---`);
      const result = await deleteEmployeeFromDB(id);
      results.push({ id, ...result } as DeleteResult);
    }
    
    console.log("\n=== 全削除処理の結果 ===");
    console.table(results);
    
    return results;
  };
  
  // 7. 安全な削除（バックアップ付き）- すでにdeleteEmployeeFromDBに実装済み
  
  // 年度データを一括削除する関数
  // 選択状態を切り替える関数
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // すべての従業員の選択状態を更新
    setLocalEmployees(prev => {
      const updatedEmployees = prev.map(emp => ({
        ...emp,
        _selected: newSelectAll
      }));
      
      // 選択数を更新
      setSelectedCount(newSelectAll ? updatedEmployees.length : 0);
      
      return updatedEmployees;
    });
  };
  
  // 個別の従業員の選択状態を切り替える関数
  const toggleSelectEmployee = (id: number) => {
    setLocalEmployees(prev => {
      const updatedEmployees = prev.map(emp => {
        if (emp.id === id) {
          // 選択状態を反転
          const newSelected = !emp._selected;
          return {
            ...emp,
            _selected: newSelected
          };
        }
        return emp;
      });
      
      // 選択数を再計算
      const newSelectedCount = updatedEmployees.filter(emp => emp._selected).length;
      setSelectedCount(newSelectedCount);
      
      // 全選択状態を更新
      setSelectAll(newSelectedCount === updatedEmployees.length && newSelectedCount > 0);
      
      return updatedEmployees;
    });
  };
  
  // 選択した従業員を一括削除する関数
  const deleteSelectedEmployees = async () => {
    // 選択された従業員を取得
    const selectedEmployees = localEmployees.filter(emp => emp._selected);
    
    if (selectedEmployees.length === 0) {
      setErrorMessage('削除する従業員が選択されていません');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // 削除確認
    if (!window.confirm(`選択した${selectedEmployees.length}人の従業員データを削除します。\nこの操作は元に戻せません。\n\n実行してもよろしいですか？`)) {
      console.log('一括削除操作がキャンセルされました');
      return;
    }
    
    // 削除処理
    console.log(`${selectedEmployees.length}人の従業員の一括削除を開始します`);
    setIsLoading(true);
    
    try {
      // 削除するIDのリスト
      const employeeIds = selectedEmployees.map(emp => emp.id);
      
      // 一括削除実行
      const result = await deleteMultipleEmployees(employeeIds);
      
      // 結果集計
      const successCount = result.filter(r => r.success).length;
      const failCount = result.length - successCount;
      
      // 成功メッセージ
      setSuccessMessage(`${successCount}人の従業員データを削除しました${failCount > 0 ? `（${failCount}件の失敗）` : ''}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // 選択状態をリセット
      setSelectAll(false);
      setSelectedCount(0);
      
      // データ更新通知
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('一括削除エラー:', error);
      setErrorMessage(`一括削除処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // CSVからのインポート処理
  // CSVファイルから検出された障害区分を正規化する関数
  const normalizeDisabilityType = (disabilityType: string): string => {
    if (!disabilityType) return '';
    
    // 小文字変換して空白を削除
    const normalized = disabilityType.toLowerCase().trim();
    
    // 障害区分の正規化マッピング
    if (normalized.includes('身体') || normalized.includes('physical')) {
      return '身体障害';
    } else if (normalized.includes('知的') || normalized.includes('intellectual')) {
      return '知的障害';
    } else if (normalized.includes('精神') || normalized.includes('mental')) {
      return '精神障害';
    } else if (normalized.includes('発達') || normalized.includes('developmental')) {
      return '発達障害';
    }
    
    // マッチしない場合は元の値を返す
    return disabilityType;
  };
  
  // 月次データのデフォルト状態を生成
  const generateDefaultMonthlyStatus = (hcValue: number | string): Record<string, number> => {
    const hc = typeof hcValue === 'string' ? parseFloat(hcValue) || 1 : hcValue || 1;
    
    return {
      '4月': hc,
      '5月': hc,
      '6月': hc,
      '7月': hc,
      '8月': hc,
      '9月': hc,
      '10月': hc,
      '11月': hc,
      '12月': hc,
      '1月': hc,
      '2月': hc,
      '3月': hc
    };
  };
  
  // 指定年度の従業員データをローカルストレージから取得
  const getStoredEmployeeData = (year: number): Record<string, Employee> => {
    try {
      // 年度に紐づいた従業員データのキー
      const storageKey = `EMPLOYEE_DATA_${year}`;
      const storedData = localStorage.getItem(storageKey);
      
      // 保存データが存在する場合はJSONとしてパース
      if (storedData) {
        return JSON.parse(storedData);
      }
      
      // データがない場合は空のオブジェクトを返す
      return {};
    } catch (error) {
      console.error(`${year}年度の従業員データ取得エラー:`, error);
      return {};
    }
  };
  
  // 従業員データをローカルストレージに保存
  const saveEmployeeDataToLocalStorage = (data: Record<string, Employee>, year: number): void => {
    try {
      // 年度に紐づいた従業員データのキー
      const storageKey = `EMPLOYEE_DATA_${year}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log(`${year}年度の従業員データを保存しました (${Object.keys(data).length}件)`);
    } catch (error) {
      console.error(`${year}年度の従業員データ保存エラー:`, error);
      setErrorMessage('データの保存中にエラーが発生しました。ブラウザのストレージ容量を確認してください。');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };
  
  // データのバックアップを作成
  const createBackup = (year: number): void => {
    try {
      // 現在のデータを取得
      const storageKey = `EMPLOYEE_DATA_${year}`;
      const currentData = localStorage.getItem(storageKey);
      
      if (!currentData) {
        console.log(`${year}年度のデータが存在しないため、バックアップは作成しません`);
        return;
      }
      
      // バックアップキーを生成（タイムスタンプ付き）
      const timestamp = new Date().getTime();
      const backupKey = `EMPLOYEE_DATA_${year}_BACKUP_${timestamp}`;
      
      // バックアップを保存
      localStorage.setItem(backupKey, currentData);
      console.log(`${year}年度の従業員データのバックアップを作成しました: ${backupKey}`);
      
      // 古いバックアップの削除（最新5件のみ保持）
      cleanupOldBackups(year);
    } catch (error) {
      console.error(`${year}年度のバックアップ作成エラー:`, error);
    }
  };
  
  // 古いバックアップの削除（最新5件のみ保持）
  const cleanupOldBackups = (year: number): void => {
    try {
      const backupPrefix = `EMPLOYEE_DATA_${year}_BACKUP_`;
      const backupKeys: string[] = [];
      
      // すべてのバックアップキーを収集
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(backupPrefix)) {
          backupKeys.push(key);
        }
      }
      
      // タイムスタンプの新しい順にソート
      backupKeys.sort().reverse();
      
      // 5件以上ある場合、古いものを削除
      if (backupKeys.length > 5) {
        const keysToRemove = backupKeys.slice(5);
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`古いバックアップを削除しました: ${key}`);
        });
      }
    } catch (error) {
      console.error('バックアップクリーンアップエラー:', error);
    }
  };

  // CSVインポート成功時のハンドラ - 改善版
  const handleCSVImportSuccess = (importedEmployees: any[]) => {
    // 年度の取得（CSVから検出された年度を優先）
    const targetYear = importedEmployees.length > 0 && importedEmployees[0].fiscal_year ? 
      importedEmployees[0].fiscal_year : fiscalYear;
    
    console.log(`CSVから${importedEmployees.length}名の従業員データをインポートします (${targetYear}年度)`);
    
    try {
      // インポートするデータのバックアップを作成
      createBackup(targetYear);
      
      // 既存データの取得（対象年度のデータを取得）
      const existingData = getStoredEmployeeData(targetYear);
      const merged: Record<string, Employee> = { ...existingData };
      
      // データの変換と統合
      let changedCount = 0;
      const changes: Record<string, Employee> = {};
      
      importedEmployees.forEach(employee => {
        // employeeIdを確実に文字列として扱う
        const employeeId = String(employee.employee_id);
        // 障害区分の正規化
        const disabilityType = normalizeDisabilityType(employee.disability_type);
        
        // 新しい従業員データオブジェクトを作成
        const newEmployeeData: Employee = {
          id: merged[employeeId]?.id || Math.max(0, ...Object.values(merged).map(e => e.id || 0)) + 1,
          no: merged[employeeId]?.no || Object.keys(merged).length + 1,
          employee_id: employeeId,
          name: employee.name,
          disability_type: disabilityType,
          disability: employee.disability || '',
          grade: employee.grade || '',
          hire_date: employee.hire_date || '',
          status: employee.status || '在籍',
          wh: employee.employment_type || employee.wh || '正社員',
          hc: parseFloat(String(employee.hc_value || employee.hc)) || 1,
          retirement_date: employee.retirement_date || null,
          monthlyStatus: employee.monthly_status || generateDefaultMonthlyStatus(employee.hc_value || employee.hc || 1),
          fiscal_year: targetYear
        };
        
        // 既存データとの差分チェック
        if (!merged[employeeId] || JSON.stringify(merged[employeeId]) !== JSON.stringify(newEmployeeData)) {
          merged[employeeId] = newEmployeeData;
          changes[employeeId] = newEmployeeData;
          changedCount++;
        }
      });
      
      console.log(`検出された変更: ${changedCount}件`, changes);
      
      // 変更が存在する場合
      if (changedCount > 0) {
        // データを保存
        saveEmployeeDataToLocalStorage(merged, targetYear);
        
        // UIに反映するためにローカル状態を更新
        const updatedEmployees = Object.values(merged);
        setLocalEmployees(updatedEmployees);
        
        // 年度が現在表示中の年度と異なる場合は、年度を切り替える確認
        if (targetYear !== fiscalYear) {
          const message = `インポートされた年度(${targetYear})が現在の表示年度(${fiscalYear})と異なります。\n年度を切り替えますか？`;
          if (window.confirm(message)) {
            console.log(`年度を切り替えます: ${fiscalYear} → ${targetYear}`);
            setFiscalYear(targetYear);
          }
        }
        
        // 成功メッセージ（変更内容の概要を含める）
        setSuccessMessage(`CSVから${importedEmployees.length}名の従業員データをインポートしました。(新規/更新: ${changedCount}件)`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setSuccessMessage('インポートされたデータに変更はありませんでした。');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      
    } catch (error) {
      console.error('CSVインポート処理エラー:', error);
      setErrorMessage(`インポート処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };
  
  const clearCurrentYearData = async () => {
    console.log(`${fiscalYear}年度のデータ一括削除処理を開始します`);
    
    try {
      // ステップ1: 現在の年度データをバックアップ
      const storageKey = `EMPLOYEE_DATA_${fiscalYear}`;
      const currentData = localStorage.getItem(storageKey);
      
      if (!currentData) {
        setErrorMessage(`${fiscalYear}年度のデータが見つかりません`);
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      
      // バックアップの作成
      const timestamp = new Date().getTime();
      const backupKey = `EMPLOYEE_DATA_${fiscalYear}_BACKUP_${timestamp}`;
      localStorage.setItem(backupKey, currentData);
      console.log(`${fiscalYear}年度のデータをバックアップしました: ${backupKey}`);
      
      // ステップ2: データの解析
      let employeeCount = 0;
      try {
        // データ形式に応じた処理
        const isObject = currentData.trim().startsWith('{');
        if (isObject) {
          const data = JSON.parse(currentData);
          employeeCount = Object.keys(data).length;
        } else {
          const data = JSON.parse(currentData);
          employeeCount = data.length;
        }
      } catch (e) {
        console.error('データ解析エラー:', e);
      }
      
      // ステップ3: 年度データの削除
      localStorage.removeItem(storageKey);
      console.log(`${fiscalYear}年度のデータを削除しました (${employeeCount}件)`);
      
      // ステップ4: UIの更新
      setLocalEmployees([]);
      setOriginalEmployees([]);
      
      // 成功メッセージの表示
      setSuccessMessage(`${fiscalYear}年度のデータを削除しました (${employeeCount}件)。\nバックアップ: ${backupKey}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      return {
        success: true,
        message: `${fiscalYear}年度のデータを削除しました (${employeeCount}件)`,
        backupKey
      };
    } catch (error) {
      console.error(`${fiscalYear}年度のデータ削除中にエラーが発生しました:`, error);
      setErrorMessage(`データ削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setErrorMessage(null), 5000);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
  
  // 8. フロントエンドでの削除処理デバッグ用
  const debugDeleteFromUI = () => {
    // 削除ボタンを探す
    console.log("UIの削除機能をデバッグします...");
    
    // 現在表示されている従業員データを確認
    console.log(`現在のページには${localEmployees.length}人の従業員データが表示されています`);
    
    if (localEmployees.length > 0) {
      const firstEmployee = localEmployees[0];
      console.log(`最初の従業員: ID=${firstEmployee.id}, 名前=${firstEmployee.name}`);
      
      // 削除ボタンをシミュレート
      const willDelete = window.confirm(`テスト削除: 従業員「${firstEmployee.name}」(ID=${firstEmployee.id})を削除しますか？`);
      
      if (willDelete) {
        console.log(`従業員ID=${firstEmployee.id}の削除をシミュレートします...`);
        
        // 通常の削除ルーチンを使用
        deleteEmployeeFromDB(firstEmployee.id)
          .then(result => {
            console.log("削除結果:", result);
            if (result.success) {
              setSuccessMessage(`テスト削除成功: ${result.message}`);
            } else {
              setErrorMessage(`テスト削除失敗: ${result.message}`);
            }
            setTimeout(() => {
              setSuccessMessage(null);
              setErrorMessage(null);
            }, 3000);
          });
      }
    }
  };
  
  // LocalStorageデータ構造分析関数
  const analyzeLocalStorageData = () => {
    console.log("=== LocalStorage データ構造分析 ===");
    
    // 全年度のデータキーを取得
    const keys = Object.keys(localStorage).filter(key => key.startsWith('EMPLOYEE_DATA_'));
    console.log(`従業員データキー: ${keys.join(', ')}`);
    
    // 各年度のデータを分析
    keys.forEach(key => {
      try {
        const yearMatch = key.match(/EMPLOYEE_DATA_(\d+)/);
        if (!yearMatch) return;
        
        const year = yearMatch[1];
        const rawData = localStorage.getItem(key);
        if (!rawData) {
          console.log(`${year}年度のデータは空です`);
          return;
        }
        
        // データ形式を判定
        const isObject = rawData.trim().startsWith('{');
        
        // パースしてデータ構造を分析
        let data;
        if (isObject) {
          // オブジェクト形式（従業員IDがキー）
          data = JSON.parse(rawData);
          const employeeIds = Object.keys(data);
          console.log(`${year}年度: オブジェクト形式, ${employeeIds.length}件`);
          
          // サンプルデータを表示
          if (employeeIds.length > 0) {
            const sampleId = employeeIds[0];
            const sampleEmployee = data[sampleId];
            console.log(`サンプル(ID=${sampleId}):`, {
              id: sampleEmployee.id,
              name: sampleEmployee.name,
              status: sampleEmployee.status,
              keys: Object.keys(sampleEmployee)
            });
          }
        } else {
          // 配列形式
          data = JSON.parse(rawData);
          console.log(`${year}年度: 配列形式, ${data.length}件`);
          
          // サンプルデータを表示
          if (data.length > 0) {
            const sampleEmployee = data[0];
            console.log(`サンプル(index=0):`, {
              id: sampleEmployee.id,
              name: sampleEmployee.name,
              status: sampleEmployee.status,
              keys: Object.keys(sampleEmployee)
            });
          }
        }
      } catch (error) {
        console.error(`${key}の分析中にエラー:`, error);
      }
    });
    
    console.log("=== 分析完了 ===");
  };
  
  // 配列データをオブジェクト形式に変換する関数
  const convertArrayToObjectFormat = (employees, year) => {
    const storageKey = `EMPLOYEE_DATA_${year}`;
    try {
      // 現在のデータを確認
      const currentData = localStorage.getItem(storageKey);
      if (!currentData) {
        console.log(`${year}年度のデータが存在しません`);
        return false;
      }
      
      // データ形式を判定
      const isObject = currentData.trim().startsWith('{');
      if (isObject) {
        console.log(`${year}年度のデータは既にオブジェクト形式です`);
        return true;
      }
      
      // 配列からオブジェクトに変換
      const dataArray = JSON.parse(currentData);
      const dataObject = {};
      
      dataArray.forEach(emp => {
        if (emp && emp.id) {
          dataObject[emp.id] = emp;
        }
      });
      
      // 変換したデータを保存
      localStorage.setItem(storageKey, JSON.stringify(dataObject));
      console.log(`${year}年度のデータを配列からオブジェクト形式に変換しました (${Object.keys(dataObject).length}件)`);
      return true;
    } catch (error) {
      console.error(`${year}年度のデータ変換中にエラー:`, error);
      return false;
    }
  };

  // 従業員データが変更された時、または年度が変更された時にHC計算を実行
  useEffect(() => {
    // 従業員データが存在する場合
    if (localEmployees.length > 0) {
      console.log(`[監視] 従業員データが変更されました。${localEmployees.length}人に対してHC計算を実行します。`);
      
      // 各従業員に対してHC計算を実行
      setTimeout(() => {
        localEmployees.forEach(employee => {
          if (employee.status && employee.hire_date && employee.hc !== undefined) {
            console.log(`[監視] ID=${employee.id}のHC計算を実行`);
            updateMonthlyStatusFromHc(employee);
          }
        });
      }, 300);
    }
  }, [fiscalYear, month]); // fiscalYearまたはmonthが変更されたときに実行

  // 初回マウント時のみ実行するuseEffect
  useEffect(() => {
    // 初回マウント時のみローカルストレージから読み込み（マウント時のみ実行されるようにする）
    console.log('初回マウント時の従業員データ初期化処理');
    
    // 従業員データが読み込まれた後、HC自動計算を実行
    if (localEmployees.length > 0) {
      console.log(`[初期化] ${localEmployees.length}人の従業員データが読み込まれました。HC計算を実行します。`);
      
      // 各従業員に対してHC計算を実行
      setTimeout(() => {
        localEmployees.forEach(employee => {
          if (employee.status && employee.hire_date && employee.hc !== undefined) {
            console.log(`[初期化] ID=${employee.id}のHC計算を実行`);
            updateMonthlyStatusFromHc(employee);
          }
        });
      }, 500);
    }
    
    // ローカルストレージを最初に読み込み
    const loadEmployeeData = async () => {
      try {
        // すでにローカルデータがロードされている場合は何もしない
        if (localEmployees.length > 0) {
          console.log('すでにローカルにデータがロードされているため初期化をスキップ', localEmployees.length, '件');
          return;
        }
        
        // 統一したストレージキーを使用
        const storageKey = `EMPLOYEE_DATA_${fiscalYear}`;
        console.log(`ストレージキー: ${storageKey} からデータをロード`);
        
        // 全てのキーを確認して古いフォーマットのキーも検索（データ移行処理）
        const allKeys = Object.keys(localStorage);
        const legacyKey = `employee_data_${fiscalYear}`;
        let savedData = localStorage.getItem(storageKey);
        
        // 新しいキーで見つからなければ古いキーを確認
        if (!savedData && allKeys.includes(legacyKey)) {
          console.log(`古いフォーマットのキー ${legacyKey} からデータを読み込みます`);
          savedData = localStorage.getItem(legacyKey);
          
          // データが見つかれば新しいキーに移行
          if (savedData) {
            console.log('古いキーから新しいキーにデータを移行します');
            localStorage.setItem(storageKey, savedData);
            // 安全を確保するために今は古いキーは削除しない
          }
        }
        
        // ローカルストレージにデータがある場合はそれを使用
        if (savedData) {
          try {
            const savedEmployees = JSON.parse(savedData);
            if (Object.keys(savedEmployees).length > 0) {
              console.log(`ローカルストレージにデータ(${Object.keys(savedEmployees).length}件)を読み込みました`);
              const savedEmployeesArray = Object.values(savedEmployees);
              
              const processedEmployees = savedEmployeesArray.map((emp: any) => ({
                ...emp,
                employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
                disability_type: emp.disability_type || '',
                disability: emp.disability || '',
                grade: emp.grade || '',
                status: emp.status || '在籍',
                hc: emp.hc !== undefined ? emp.hc : 1,
                monthlyStatus: Array.isArray(emp.monthlyStatus) ? emp.monthlyStatus : Array(12).fill('')
              }));
              
              const originalEmployeesCopy = JSON.parse(JSON.stringify(processedEmployees));
              
              setLocalEmployees(processedEmployees);
              setOriginalEmployees(originalEmployeesCopy);
              
              // 親コンポーネントに初期データを通知
              if (onEmployeesUpdate) {
                console.log('親コンポーネントに初期データを通知');
                onEmployeesUpdate(processedEmployees);
              }
              
              return true; // データがロードされたことを示す
            }
          } catch (error) {
            console.error('ローカルストレージデータの解析エラー:', error);
          }
        }
        
        // ローカルストレージになければプロパティから初期化
        if (employees && employees.length > 0) {
          console.log('propsからデータを初期化:', employees.length, '件');
          
          const processedEmployees = employees.map(emp => ({
            ...emp,
            employee_id: typeof emp.employee_id === 'number' ? String(emp.employee_id) : emp.employee_id,
            disability_type: emp.disability_type || '',
            disability: emp.disability || '',
            grade: emp.grade || '',
            status: emp.status || '在籍',
            hc: emp.hc !== undefined ? emp.hc : 1,
            monthlyStatus: Array.isArray(emp.monthlyStatus) ? emp.monthlyStatus : Array(12).fill('')
          }));
          
          const originalEmployeesCopy = JSON.parse(JSON.stringify(processedEmployees));
          
          setLocalEmployees(processedEmployees);
          setOriginalEmployees(originalEmployeesCopy);
          return true; // データがロードされたことを示す
        }
        
        return false; // データがロードされなかった
      } catch (error) {
        console.error('従業員データの初期化エラー:', error);
        return false;
      }
    };
    
    // データ読み込み実行
    loadEmployeeData();
    
    // クリーンアップ関数
    return () => {
      console.log('EmployeesTabコンポーネントがアンマウントされます');
    };
  // 依存配列を空に保ち、初回マウント時のみ実行。fiscalYearは不要（別のuseEffectが担当）
  }, []);

  // localEmployees変更時に自動計算を実行
  useEffect(() => {
    // データがロードされた場合に自動計算を実行
    if (localEmployees.length > 0) {
      console.log(`[HC] localEmployees変更を検知 (${localEmployees.length}件) - 自動計算を実行します`);
      
      // 各従業員に対してHC自動計算を実行
      localEmployees.forEach(employee => {
        if (employee.hc !== undefined && employee.hire_date && employee.status) {
          console.log(`[HC] 従業員ID=${employee.id}のHC自動計算を実行`);
          // 少し遅延させて実行
          setTimeout(() => {
            updateMonthlyStatusFromHc(employee);
          }, 100);
        }
      });
    }
  }, [localEmployees.length]); // localEmployees.lengthが変わった時に実行

  // 編集モード切り替えハンドラー
  const handleToggleEditMode = () => {
    console.log('編集モード切替ボタンクリック:', !actualIsEditing);
    
    setInternalIsEditing(!internalIsEditing);
    
    if (onToggleEditMode) {
      onToggleEditMode();
    }
    
    if (actualIsEditing) {
      setErrorMessage(null);
      setIsAddingNewRow(false);
      setInputValues({});
    }
  };

  // 編集キャンセルハンドラー
  const handleCancelEdit = () => {
    console.log('編集をキャンセルします');
    
    setLocalEmployees([...JSON.parse(JSON.stringify(originalEmployees))]);
    
    setInternalIsEditing(false);
    if (onToggleEditMode) {
      onToggleEditMode();
    }
    
    setErrorMessage(null);
    setIsAddingNewRow(false);
    setInputValues({});
    
    setSuccessMessage('編集をキャンセルしました');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // HC値の変更ハンドラー
  const handleHcChange = (id: number, value: string) => {
    console.log(`[HC] handleHcChange呼び出し: ID=${id}, 値=${value}`);
    console.log(`HC値変更: ID=${id}, 値=${value}`);
    
    // 従業員データの確認
    const currentEmployee = localEmployees.find(emp => emp.id === id);
    console.log('[DEBUG] handleHcChange対象従業員:', {
      従業員ID: id,
      従業員データあり: !!currentEmployee,
      従業員名: currentEmployee?.name,
      状態: currentEmployee?.status,
      採用日: currentEmployee?.hire_date,
      雇用形態: currentEmployee?.wh,
      HC値: currentEmployee?.hc,
      新しい値: value,
      退職日: currentEmployee?.retirement_date
    });
    
    // 数値入力チェック
    if (value === '') {
      // 空の場合は許可
      setInputValues(prev => ({
        ...prev,
        [`${id}-hc`]: value
      }));
      
      // 空の場合はHC値をクリア
      setLocalEmployees(prev => {
        // 現在の従業員を取得して確実に処理する
        const currentEmployee = prev.find(emp => emp.id === id);
        if (!currentEmployee) {
          console.error(`ID=${id}の従業員が見つかりません`);
          return prev;
        }
        
        const updated = prev.map(emp => {
          if (emp.id === id) {
            const updatedEmp = { ...emp, hc: undefined };
            return updatedEmp;
          }
          return emp;
        });
        
        // 月次ステータス値をクリア（HC値がなくなるため）
        setTimeout(() => {
          const employeeToUpdate = updated.find(emp => emp.id === id);
          if (employeeToUpdate) {
            console.log(`HC値クリア時の月次ステータス更新 - ID=${id}`);
            
            // HC値がundefinedなので、月次ステータスは全て空になる
            setLocalEmployees(current => {
              return current.map(emp => {
                if (emp.id === id) {
                  return { 
                    ...emp, 
                    monthlyStatus: Array(12).fill('') 
                  };
                }
                return emp;
              });
            });
          }
        }, 50);
        
        // 親コンポーネントへの通知はバッチ処理のために遅延させる（非同期処理）
        setTimeout(() => {
          if (onEmployeesUpdate) {
            console.log('HC値変更 (空): 親コンポーネントに通知', updated.length, '件');
            onEmployeesUpdate(updated);
          }
        }, 100);
        
        return updated;
      });
      setErrorMessage(null);
      return;
    }
    
    // セレクトボックスからの値を数値に変換
    const numValue = parseFloat(value);
    // ドロップダウンメニューからの選択値なので入力チェックは不要（常に有効な値）
    
    // 入力値の状態を更新
    setInputValues(prev => ({
      ...prev,
      [`${id}-hc`]: value
    }));
    
    // ローカル従業員データの状態を更新
    setLocalEmployees(prev => {
      // 現在の従業員を取得して確実に処理する
      const currentEmployee = prev.find(emp => emp.id === id);
      if (!currentEmployee) {
        console.error(`ID=${id}の従業員が見つかりません`);
        return prev;
      }
      
      const updated = prev.map(emp => {
        if (emp.id === id) {
          const updatedEmp = { ...emp, hc: numValue };
          console.log(`HC値を更新: `, updatedEmp);
          return updatedEmp;
        }
        return emp;
      });
      
      // 非同期で月次ステータス値を自動計算
      setTimeout(() => {
        const employeeToUpdate = updated.find(emp => emp.id === id);
        if (employeeToUpdate) {
          console.log(`[HC] HC値変更後の自動計算を実行します - ID=${id}, 値=${numValue}`);
          console.log(`HC自動計算実行開始（HC値変更時） - ID=${id}, 値=${numValue}`);
          // 必ず計算ロジックを呼び出す
          updateMonthlyStatusFromHc(employeeToUpdate);
          console.log(`HC自動計算実行完了（HC値変更時） - ID=${id}`);
        }
      }, 50);
      
      // 親コンポーネントへの通知はバッチ処理のために遅延させる（非同期処理）
      setTimeout(() => {
        if (onEmployeesUpdate) {
          console.log('HC値変更: 親コンポーネントに通知', updated.length, '件');
          onEmployeesUpdate(updated);
        }
      }, 150); // 月次ステータス更新後に通知するために少し長めの遅延
      
      return updated;
    });
    setErrorMessage(null);
  };
  
  // 採用日と状態に基づいて月次ステータスを更新する関数
  const updateMonthlyStatusFromHc = (employee: Employee) => {
    console.log('[HC] 計算処理開始');
    console.log(`===== HC自動計算関数開始 - ID=${employee.id} =====`);
    
    // 必要なデータがない場合は何もしない
    if (!employee.hire_date || !employee.status || employee.hc === undefined) {
      console.log('【エラー】自動計算に必要なデータがありません:', { hire_date: employee.hire_date, status: employee.status, hc: employee.hc });
      return;
    }
    
    console.log(`【HC自動計算】入力データ:`, {
      従業員ID: employee.id,
      従業員名: employee.name,
      採用日: employee.hire_date,
      状態: employee.status,
      雇用形態: employee.wh || '正社員',
      HC値: employee.hc,
      退職日: employee.retirement_date || '未設定'
    });
    
    try {
      // 採用日をDateオブジェクトに変換
      const hireDateParts = employee.hire_date.split('/');
      if (hireDateParts.length !== 3) {
        console.error('【エラー】採用日のフォーマットが不正です:', employee.hire_date);
        return;
      }
      
      const hireYear = parseInt(hireDateParts[0]);
      const hireMonth = parseInt(hireDateParts[1]);
      const hireDay = parseInt(hireDateParts[2]);
      
      if (isNaN(hireYear) || isNaN(hireMonth) || isNaN(hireDay)) {
        console.error('【エラー】採用日のパースに失敗しました:', { hireYear, hireMonth, hireDay });
        return;
      }
      
      // 現在の月次ステータスを取得または初期化
      const newMonthlyStatus = [...(employee.monthlyStatus || Array(12).fill(''))];
      
      // 表示年度と表示月を取得
      const displayYear = fiscalYear;
      const displayMonth = month;
      
      // 2025年5月を固定値として使用（要件に合わせて）
      const systemCurrentYear = 2025;
      const systemCurrentMonth = 5;
      
      // 退職日の取得（退職状態の場合）
      type RetirementMonthType = { year: number; month: number } | null;
      let retirementMonth: RetirementMonthType = null;
      if (employee.status === '退職' && employee.retirement_date) {
        // 退職日がある場合はパース
        const retirementParts = employee.retirement_date.split('/');
        if (retirementParts.length === 3) {
          const retireYear = parseInt(retirementParts[0]);
          const retireMonth = parseInt(retirementParts[1]);
          retirementMonth = { year: retireYear, month: retireMonth };
          console.log(`【退職処理】退職日が設定されています: ${retireYear}年${retireMonth}月`);
        }
      } 
      
      // 年度表示関係の判定
      const yearRelation = displayYear < systemCurrentYear ? "過去" : 
                           displayYear === systemCurrentYear ? "現在" : "未来";
      
      console.log(`【HC自動計算】基本情報: 採用日=${hireYear}/${hireMonth}/${hireDay}, ` + 
                  `表示年度(${yearRelation}年度)=${displayYear}/${displayMonth}, ` + 
                  `現在日付(固定)=${systemCurrentYear}/${systemCurrentMonth}, ` + 
                  `退職日=${retirementMonth ? `${retirementMonth.year}/${retirementMonth.month}` : '未設定'}`);
      
      // 各月について処理
      monthNumbers.forEach((monthNum, index) => {
        // 会計年度を考慮して年を調整（1-3月は次の年）
        const calendarYear = monthNum >= 4 ? displayYear : displayYear + 1;
        
        // 採用月以降かどうか
        const isAfterHireDate = isDateAfterHireDate(calendarYear, monthNum, hireYear, hireMonth);
        
        // 表示年度を考慮した現在月以前かどうか
        const isBeforeCurrentRealMonth = isBeforeOrEqualCurrentMonth(calendarYear, monthNum, systemCurrentYear, systemCurrentMonth);
        
        // 退職月以前かどうか（退職状態の場合のみ関連）
        let isBeforeRetirementMonth = true;
        if (employee.status === '退職' && retirementMonth) {
          isBeforeRetirementMonth = (calendarYear < retirementMonth.year) || 
                                   (calendarYear === retirementMonth.year && monthNum <= retirementMonth.month);
          console.log(`【退職月判定】${monthNumbers[index]}月: 退職月(${retirementMonth.year}/${retirementMonth.month})以前=${isBeforeRetirementMonth}`);
        }
        
        // 詳細なログ出力（デバッグ用）
        console.log(`【月次処理】[${index+1}]=${monthNumbers[index]}月: 暦年=${calendarYear}, ` +
                    `採用日以降=${isAfterHireDate}, 表示対象=${isBeforeCurrentRealMonth}`);
        
        // 状態に応じた処理
        if (employee.status === '在籍') {
          // 在籍の場合、採用日以降かつ表示対象かどうかで判定
          if (isAfterHireDate && isBeforeCurrentRealMonth) {
            newMonthlyStatus[index] = employee.hc!;
            console.log(`  → 在籍: ${monthNumbers[index]}月にHC値${employee.hc}を設定`);
          } else if (!isAfterHireDate) {
            newMonthlyStatus[index] = '';
            console.log(`  → 在籍: ${monthNumbers[index]}月は採用日前のため空白`);
          } else {
            newMonthlyStatus[index] = '';
            console.log(`  → 在籍: ${monthNumbers[index]}月は未来月のため空白`);
          }
        } else if (employee.status === '退職') {
          // 退職の場合、採用日以降かつ退職月以前かつ現在月以前はHC値を設定
          if (isAfterHireDate && isBeforeCurrentRealMonth) {
            if (retirementMonth && !isBeforeRetirementMonth) {
              // 退職月が設定されており、それより後の月は空白に
              newMonthlyStatus[index] = '';
              console.log(`  → 退職: ${monthNumbers[index]}月は退職月(${retirementMonth.year}/${retirementMonth.month})より後のため空白`);
            } else {
              // 退職月以前（または退職月未設定）なら表示
              newMonthlyStatus[index] = employee.hc!;
              console.log(`  → 退職: ${monthNumbers[index]}月にHC値${employee.hc}を設定 (${calendarYear}年${monthNum}月)`);
            }
          } else if (!isAfterHireDate) {
            newMonthlyStatus[index] = '';
            console.log(`  → 退職: ${monthNumbers[index]}月は採用日前のため空白`);
          } else {
            newMonthlyStatus[index] = '';
            console.log(`  → 退職: ${monthNumbers[index]}月は未来月のため空白`);
          }
        } else {
          // その他の状態は変更なし
          console.log(`  → その他の状態: ${employee.status} - 変更なし`);
        }
      });
      
      // 月次ステータスを更新
      setLocalEmployees(prev => {
        return prev.map(emp => {
          if (emp.id === employee.id) {
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        });
      });
      
      console.log(`ID=${employee.id}の月次ステータスを自動計算しました:`, newMonthlyStatus);
      console.log(`===== HC自動計算関数終了 - ID=${employee.id} =====`);
    } catch (error) {
      console.error('月次ステータスの自動計算でエラーが発生しました:', error);
      console.log(`===== HC自動計算関数エラー終了 - ID=${employee.id} =====`);
    }
  };
  
  // 指定した年月が採用日以降かどうかをチェックする関数
  const isDateAfterHireDate = (year: number, month: number, hireYear: number, hireMonth: number): boolean => {
    // 年が採用年より後の場合は true
    if (year > hireYear) return true;
    // 年が採用年と同じで、月が採用月以降の場合は true
    if (year === hireYear && month >= hireMonth) return true;
    // それ以外は false
    return false;
  };
  
  // 指定した年月が現在表示中の年月以前かどうかをチェックする関数
  const isBeforeCurrentDisplayMonth = (year: number, month: number, displayYear: number, displayMonth: number): boolean => {
    // 年が表示年より前の場合は true
    if (year < displayYear) return true;
    // 年が表示年と同じで、月が表示月以前の場合は true
    if (year === displayYear && month <= displayMonth) return true;
    // それ以外は false
    return false;
  };
  
  // 指定した年月が表示中の年度を考慮して有効かどうかをチェックする関数
  const isBeforeOrEqualCurrentMonth = (year: number, month: number, currentYear: number, currentMonth: number): boolean => {
    console.log(`【日付比較】検証: 暦年${year}月${month} vs 現在${currentYear}月${currentMonth}`);
    
    // 表示中の年度（UIで選択された年度）
    const displayFiscalYear = fiscalYear;
    
    // 2025年5月を固定値として扱う（要件に合わせて）
    // システム上の「現在」は常に2025年5月として扱う
    const systemCurrentYear = 2025;
    const systemCurrentMonth = 5;
    
    console.log(`【日付比較】現在日付(固定値): ${systemCurrentYear}年${systemCurrentMonth}月 (※要件に合わせて2025/5を使用)`);
    console.log(`【日付比較】表示中の年度: ${displayFiscalYear}年度`);
    
    // 表示年度が過去の年度の場合（表示年度 < 現在システム年度）
    // 2024年度やそれ以前の過去年度データは全て表示（HC計算）するため常にtrueを返す
    if (displayFiscalYear < systemCurrentYear) {
      console.log(`【判定】過去年度(${displayFiscalYear}年)の表示: ${year}/${month}月 → すべて表示する`);
      return true;
    }
    
    // 表示年度が現在年度の場合（表示年度 = 現在システム年度 = 2025年度）
    // 現在年度なら5月までの月を表示対象とする
    if (displayFiscalYear === systemCurrentYear) {
      // 4-12月は2025年、1-3月は2026年の暦月として処理
      const result = (year < systemCurrentYear) || 
                     (year === systemCurrentYear && month <= systemCurrentMonth);
      
      console.log(`【判定】現在年度(${displayFiscalYear}年)の表示: ${year}/${month}月 vs 現在${systemCurrentYear}/${systemCurrentMonth}月 → ${result ? '表示する' : '表示しない'}`);
      return result;
    }
    
    // 表示年度が未来年度の場合（表示年度 > 現在システム年度）
    // 現在（システム）日付までのみ表示（※通常は発生しない条件だが念のため）
    if (displayFiscalYear > systemCurrentYear) {
      // 未来年度の場合は特別処理：現在月までのみ表示
      const result = (year < systemCurrentYear) || 
                     (year === systemCurrentYear && month <= systemCurrentMonth);
      
      console.log(`【判定】未来年度(${displayFiscalYear}年)の表示: ${year}/${month}月 vs 現在${systemCurrentYear}/${systemCurrentMonth}月 → ${result ? '表示する' : '表示しない'}`);
      return result;
    }
    
    // それ以外は表示しない（通常はここには来ない）
    console.log(`【判定】不明な条件のため表示しない: ${year}/${month}月`);
    return false;
  };

  // フィールド更新ハンドラー
  const handleFieldChange = (id: number, field: string, value: string | number) => {
    console.log(`【フィールド変更】ID=${id}, フィールド=${field}, 値=${value}, 型=${typeof value}`);
    
    // 入力値の状態を更新
    setInputValues(prev => ({
      ...prev,
      [`${id}-${field}`]: value
    }));
    
    // ローカル従業員データの状態を更新
    setLocalEmployees(prev => {
      // 変更前のデータを取得（退職処理のためのログとチェック）
      const prevEmployee = prev.find(emp => emp.id === id);
      if (prevEmployee) {
        console.log(`【変更前】従業員データ:`, {
          ID: prevEmployee.id,
          名前: prevEmployee.name,
          状態: prevEmployee.status,
          採用日: prevEmployee.hire_date,
          退職日: prevEmployee.retirement_date,
          HC: prevEmployee.hc
        });
      }
      
      return prev.map(emp => {
        if (emp.id === id) {
          // 値の適切な型変換を行う
          let convertedValue = value;
          if (field === 'status' && typeof value !== 'string') {
            convertedValue = String(value);
          }
          
          // 状態が退職に変更された場合、将来年度のデータをクリーンアップする
          if (field === 'status' && value === '退職' && emp.status !== '退職') {
            console.log(`従業員ID=${id}の状態が退職に変更されました。将来年度のデータをクリーンアップします。`);
            
            // 現在の年度を取得
            const currentFiscalYear = fiscalYear;
            
            // 未来の年度に対して処理を行う（現在の年度+1から2030年まで）
            for (let year = currentFiscalYear + 1; year <= 2030; year++) {
              const futureYearStorageKey = `EMPLOYEE_DATA_${year}`;
              try {
                // 該当年度のデータを取得
                const futureYearData = localStorage.getItem(futureYearStorageKey);
                if (futureYearData) {
                  const parsedData = JSON.parse(futureYearData);
                  
                  // 退職従業員のデータがあるか確認
                  if (parsedData[id]) {
                    // 退職従業員のデータを削除
                    delete parsedData[id];
                    
                    // 更新したデータを保存
                    localStorage.setItem(futureYearStorageKey, JSON.stringify(parsedData));
                    console.log(`従業員ID=${id}の${year}年度のデータを削除しました`);
                  }
                }
              } catch (error) {
                console.error(`${year}年度のデータクリーンアップでエラーが発生しました:`, error);
              }
            }
          }
          
          // フィールド更新と退職処理を一度に行う
          let updatedFields: Record<string, any> = { [field]: convertedValue };
          
          // 重要: 「退職」状態への変更を特別に処理
          if (field === 'status' && convertedValue === '退職') {
            console.log(`【退職処理】従業員が退職状態に変更されました - ID=${id}`);
            
            // 退職日が未設定の場合は、現在の表示月を退職月として設定
            if (!emp.retirement_date) {
              // 現在の年月を退職日として設定（2025年5月を使用）
              const retirementYear = 2025; 
              const retirementMonth = 5;
              const retirementDay = 1; // 月初日を使用
              
              const retirementDate = `${retirementYear}/${retirementMonth}/${retirementDay}`;
              // フィールド更新に退職日も追加
              updatedFields.retirement_date = retirementDate;
              
              console.log(`【退職処理】退職日を自動設定しました: ${retirementDate}`);
            }
          }
          
          // すべての更新フィールドを適用
          const updatedEmp = { ...emp, ...updatedFields };
          
          console.log(`【更新後】フィールド "${field}" を更新:`, {
            ID: updatedEmp.id,
            名前: updatedEmp.name,
            状態: updatedEmp.status,
            採用日: updatedEmp.hire_date,
            退職日: updatedEmp.retirement_date,
            HC: updatedEmp.hc
          });
          
          // 採用日または状態が変更された場合は、HC値に基づいて月次ステータスを再計算
          if (field === 'status' || field === 'hire_date') {
            console.log(`[HC] ${field}が変更されたため自動計算を実行します`);
            console.log(`【重要フィールド変更】"${field}" が変更されたため、HC自動計算を実行します`);
            
            // 少し遅延して実行（状態が先に更新されるのを待つ）
            setTimeout(() => {
              console.log(`【HC自動計算】実行開始 - ID=${id}, フィールド=${field}, 値=${value}`);
              updateMonthlyStatusFromHc(updatedEmp);
              console.log(`【HC自動計算】実行完了 - ID=${id}`);
            }, 50); // 確実に更新後に実行されるよう少し長めの遅延を設定
          }
          
          return updatedEmp;
        }
        return emp;
      });
    });
  };

  // 新規行データの更新ハンドラー
  const handleNewRowFieldChange = (field: string, value: string | number) => {
    console.log(`【新規行】フィールド変更: フィールド=${field}, 値=${value}, 型=${typeof value}`);
    
    setInputValues(prev => ({
      ...prev,
      [`new-${field}`]: value
    }));
    
    // 重要: 「退職」状態への変更を特別に処理
    if (field === 'status' && value === '退職') {
      console.log(`【新規行】退職状態に変更されました`);
      
      // 退職日が未設定の場合は、現在の表示月を退職月として設定
      const hasRetirementDate = newRowData && typeof newRowData === 'object' && 'retirement_date' in newRowData && Boolean(newRowData.retirement_date);
      if (!hasRetirementDate) {
        // 現在の年月を退職日として設定（2025年5月を使用）
        const retirementYear = 2025; 
        const retirementMonth = 5;
        const retirementDay = 1; // 月初日を使用
        
        const retirementDate = `${retirementYear}/${retirementMonth}/${retirementDay}`;
        
        setNewRowData(prev => ({
          ...prev,
          [field]: value,
          retirement_date: retirementDate
        }));
        
        console.log(`【新規行】退職日を自動設定しました: ${retirementDate}`);
        
        // 採用日または状態が変更された場合は、HC値に基づいて月次ステータスを再計算
        if (newRowData.hc !== undefined) {
          console.log(`[HC] 新規行退職時: 自動計算を実行します`);
          console.log(`【新規行】重要フィールド "${field}" が変更されたため、HC自動計算を実行します`);
          
          setTimeout(() => {
            // 非同期で月次ステータスを更新（状態変更が適用されるのを待つ）
            const updatedNewRowData = { 
              ...newRowData,
              [field]: value,
              retirement_date: retirementDate
            };
            
            console.log(`【新規行】HC自動計算実行開始: `, updatedNewRowData);
            // 型を明示的に指定してキャスト
            updateMonthlyStatusForNewRow(updatedNewRowData as NewRowData);
            console.log(`【新規行】HC自動計算実行完了`);
          }, 100);
        }
        
        return; // 早期リターン
      }
    }
    
    // 通常のフィールド更新
    setNewRowData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 採用日または状態が変更された場合は、HC値に基づいて月次ステータスを再計算
    if ((field === 'status' || field === 'hire_date') && newRowData.hc !== undefined) {
      console.log(`[HC] 新規行: ${field}が変更されたため自動計算を実行します`);
      console.log(`【新規行】重要フィールド "${field}" が変更されたため、HC自動計算を実行します`);
      
      setTimeout(() => {
        // 非同期で月次ステータスを更新（状態変更が適用されるのを待つ）
        const updatedNewRowData = { 
          ...newRowData, 
          [field]: field === 'status' ? String(value) : value // 状態は明示的に文字列に変換
        };
        
        console.log(`新規行 HC自動計算実行開始 - フィールド=${field}, 値=${value}`);
        updateMonthlyStatusForNewRow(updatedNewRowData as NewRowData);
        console.log(`新規行 HC自動計算実行完了`);
      }, 50); // 確実に更新後に実行されるよう少し長めの遅延を設定
    }
  };
  
  // 新規行のHC値変更ハンドラー
  const handleNewRowHcChange = (value: string) => {
    console.log(`[HC] handleNewRowHcChange呼び出し: 値=${value}`);
    console.log(`新規行のHC値変更: 値=${value}`);
    
    // 新規行データの確認
    console.log('[DEBUG] handleNewRowHcChange対象データ:', {
      新規行データあり: !!newRowData,
      現在のHC値: newRowData?.hc,
      新しい値: value,
      状態: newRowData?.status,
      採用日: newRowData?.hire_date
    });
    
    // 数値入力チェック
    if (value === '') {
      // 空の場合は許可
      setInputValues(prev => ({
        ...prev,
        [`new-hc`]: value
      }));
      
      // 空の場合はHC値をクリア
      setNewRowData(prev => {
        const updated = {
          ...prev,
          hc: undefined
        };
        
        // HC値がクリアされた場合は月次ステータスも全てクリア
        setTimeout(() => {
          console.log(`新規行: HC値クリア時の月次ステータス更新`);
          setNewRowData(current => ({
            ...current,
            monthlyStatus: Array(12).fill('')
          }));
        }, 50);
        
        return updated;
      });
      setErrorMessage(null);
      return;
    }
    
    // セレクトボックスからの値を数値に変換
    const numValue = parseFloat(value);
    // ドロップダウンメニューからの選択値なので入力チェックは不要（常に有効な値）
    
    // 入力値の状態を更新
    setInputValues(prev => ({
      ...prev,
      [`new-hc`]: value
    }));
    
    // 新規行データの状態を更新
    const updatedNewRowData = {
      ...newRowData,
      hc: numValue,
      // 明示的に型を確保
      status: String(newRowData.status || ''),
      employee_id: newRowData.employee_id || '',
      name: newRowData.name || '',
      disability_type: newRowData.disability_type || '',
      disability: newRowData.disability || '',
      grade: newRowData.grade || '',
      hire_date: newRowData.hire_date || '',
    };
    setNewRowData(updatedNewRowData);
    
    // 月次ステータス値を自動計算（採用日と状態がある場合のみ）
    if (updatedNewRowData.status && updatedNewRowData.hire_date) {
      console.log(`[HC] 新規行HC値変更後の自動計算を実行します - 値=${numValue}`);
      console.log(`新規行 HC自動計算実行開始（HC値変更時） - 値=${numValue}`);
      // 必ず計算ロジックを呼び出す
      updateMonthlyStatusForNewRow(updatedNewRowData as NewRowData);
      console.log(`新規行 HC自動計算実行完了（HC値変更時）`);
    } else {
      console.log(`新規行: HC値を${numValue}に設定しましたが、採用日または状態が設定されていないため自動計算を実行しません`, {
        status: updatedNewRowData.status,
        hire_date: updatedNewRowData.hire_date
      });
    }
    
    setErrorMessage(null);
  };
  
  // 新規行の採用日と状態に基づいて月次ステータスを更新する関数
  interface NewRowData {
    no?: number;
    employee_id: string | number;
    name: string;
    disability_type: string;
    disability: string;
    grade: string;
    hire_date: string;
    status: string;
    hc?: number;
    monthlyStatus?: any[];
    memo?: string;
    count?: number;
    retirement_date?: string;
  }
  
  const updateMonthlyStatusForNewRow = (rowData: NewRowData) => {
    console.log('[HC] 新規行計算処理開始');
    console.log(`===== 【新規行】HC自動計算関数開始 =====`);
    
    // 必要なデータがない場合は何もしない
    if (!rowData.hire_date || !rowData.status || rowData.hc === undefined) {
      console.log('【新規行】自動計算に必要なデータがありません:', { hire_date: rowData.hire_date, status: rowData.status, hc: rowData.hc });
      return;
    }
    
    // 退職状態の場合に退職日の確認
    if (rowData.status === '退職' && !rowData.retirement_date) {
      console.log('【新規行】退職状態だが退職日が未設定のため、現在月を退職日として自動設定します');
      
      // 現在の年月を退職日として設定（2025年5月を使用）
      const retirementYear = 2025; 
      const retirementMonth = 5;
      const retirementDay = 1; // 月初日を使用
      
      rowData.retirement_date = `${retirementYear}/${retirementMonth}/${retirementDay}`;
    }
    
    console.log(`新規行 HC自動計算用データ:`, {
      従業員名: rowData.name,
      採用日: rowData.hire_date,
      状態: rowData.status,
      HC値: rowData.hc
    });
    
    try {
      // 採用日をDateオブジェクトに変換
      const hireDateParts = rowData.hire_date.split('/');
      if (hireDateParts.length !== 3) {
        console.error('採用日のフォーマットが不正です:', rowData.hire_date);
        return;
      }
      
      const hireYear = parseInt(hireDateParts[0]);
      const hireMonth = parseInt(hireDateParts[1]);
      const hireDay = parseInt(hireDateParts[2]);
      
      if (isNaN(hireYear) || isNaN(hireMonth) || isNaN(hireDay)) {
        console.error('採用日のパースに失敗しました:', { hireYear, hireMonth, hireDay });
        return;
      }
      
      // 現在の月次ステータスを取得または初期化
      const newMonthlyStatus = [...(rowData.monthlyStatus || Array(12).fill(''))];
      
      // 表示年度と表示月を取得
      const displayYear = fiscalYear;
      const displayMonth = month;
      
      // 現在の実際の年月を取得（システム日付）
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // JavaScriptの月は0始まり
      
      // システム年度と表示年度の関係を分かりやすく表示
      const yearRelation = displayYear < currentYear ? "過去" : 
                           displayYear === currentYear ? "現在" : "未来";
      
      console.log(`新規行 HC自動計算 - 採用日: ${hireYear}/${hireMonth}/${hireDay}, ` + 
                  `表示年度(${yearRelation}年度): ${displayYear}/${displayMonth}, ` + 
                  `現在日付: ${currentYear}/${currentMonth}`);
      
      // 各月について処理
      monthNumbers.forEach((monthNum, index) => {
        // 会計年度を考慮して年を調整（1-3月は次の年）
        const calendarYear = monthNum >= 4 ? displayYear : displayYear + 1;
        
        // 採用月以降かどうか
        const isAfterHireDate = isDateAfterHireDate(calendarYear, monthNum, hireYear, hireMonth);
        
        // 表示年度を考慮した現在月以前かどうか
        const isBeforeCurrentRealMonth = isBeforeOrEqualCurrentMonth(calendarYear, monthNum, currentYear, currentMonth);
        
        // 詳細なログ出力（デバッグ用）
        console.log(`新規行 月[${index+1}]=${monthNumbers[index]}月の処理: 暦年${calendarYear}, ` +
                    `採用日以降=${isAfterHireDate}, 表示対象=${isBeforeCurrentRealMonth}`);
        
        // 状態に応じた処理
        if (rowData.status === '在籍') {
          // 在籍の場合、採用日以降かつ表示対象かどうかで判定
          if (isAfterHireDate && isBeforeCurrentRealMonth) {
            newMonthlyStatus[index] = rowData.hc!;
            console.log(`  → 在籍: ${monthNumbers[index]}月にHC値${rowData.hc}を設定`);
          } else if (!isAfterHireDate) {
            newMonthlyStatus[index] = '';
            console.log(`  → 在籍: ${monthNumbers[index]}月は採用日前のため空白`);
          } else {
            newMonthlyStatus[index] = '';
            console.log(`  → 在籍: ${monthNumbers[index]}月は未来月のため空白`);
          }
        } else if (rowData.status === '退職') {
          // 退職日の取得
          type RetirementMonthType = { year: number; month: number } | null;
          let retirementMonth: RetirementMonthType = null;
          if (rowData.retirement_date) {
            const retirementParts = rowData.retirement_date.split('/');
            if (retirementParts.length === 3) {
              const retireYear = parseInt(retirementParts[0]);
              const retireMonth = parseInt(retirementParts[1]);
              retirementMonth = { year: retireYear, month: retireMonth };
            }
          }
          
          // 退職月以前かどうか
          let isBeforeRetirementMonth = true;
          if (retirementMonth) {
            isBeforeRetirementMonth = (calendarYear < retirementMonth.year) || 
                                     (calendarYear === retirementMonth.year && monthNum <= retirementMonth.month);
            console.log(`【新規行】【退職月判定】${monthNumbers[index]}月: 退職月(${retirementMonth.year}/${retirementMonth.month})以前=${isBeforeRetirementMonth}`);
          }
          
          // 退職の場合、採用日以降かつ表示月以前かつ退職月以前はHC値を設定
          if (isAfterHireDate && isBeforeCurrentRealMonth) {
            if (retirementMonth && !isBeforeRetirementMonth) {
              // 退職月が設定されており、それより後の月は空白に
              newMonthlyStatus[index] = '';
              console.log(`  → 退職: ${monthNumbers[index]}月は退職月(${retirementMonth.year}/${retirementMonth.month})より後のため空白`);
            } else {
              // 退職月以前（または退職月未設定）なら表示
              newMonthlyStatus[index] = rowData.hc!;
              console.log(`  → 退職: ${monthNumbers[index]}月にHC値${rowData.hc}を設定`);
            }
          } else if (!isAfterHireDate) {
            newMonthlyStatus[index] = '';
            console.log(`  → 退職: ${monthNumbers[index]}月は採用日前のため空白`);
          } else {
            newMonthlyStatus[index] = '';
            console.log(`  → 退職: ${monthNumbers[index]}月は未来月のため空白`);
          }
        } else {
          // その他の状態は変更なし
          console.log(`  → その他の状態: ${rowData.status} - 変更なし`);
        }
      });
      
      // 新規行データの月次ステータスを更新
      setNewRowData(prev => ({
        ...prev,
        monthlyStatus: newMonthlyStatus
      }));
      
      console.log('新規行の月次ステータスを自動計算しました:', newMonthlyStatus);
      console.log(`===== 新規行 HC自動計算関数終了 =====`);
    } catch (error) {
      console.error('新規行の月次ステータスの自動計算でエラーが発生しました:', error);
      console.log(`===== 新規行 HC自動計算関数エラー終了 =====`);
    }
  };

  // 月次ステータス更新ハンドラー
  const handleMonthlyStatusChange = (id: number, monthIndex: number, value: string) => {
    console.log(`月次ステータス変更: ID=${id}, 月=${monthIndex}, 値=${value}`);
    
    // 入力値を状態に保存
    setInputValues(prev => ({
      ...prev,
      [`${id}-monthlyStatus-${monthIndex}`]: value
    }));
    
    // 空の場合は空文字列を設定
    if (value === "") {
      setLocalEmployees(prev => {
        return prev.map(emp => {
          if (emp.id === id) {
            const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(''))];
            newMonthlyStatus[monthIndex] = '';
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        });
      });
      setErrorMessage(null);
      return;
    }
    
    // 数値変換
    let convertedValue: number | string = value;
    // 数値としてパース
    if (value === "1" || value === "2" || value === "0" || value === "0.5") {
      convertedValue = parseFloat(value);
    }
    
    // 有効な値かどうか確認
    const validValues = [0, 0.5, 1, 2];
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && validValues.includes(numValue)) {
      console.log(`有効な月次ステータス値を設定: ID=${id}, 月=${monthIndex}, 値=${convertedValue}`);
      
      setLocalEmployees(prev => {
        return prev.map(emp => {
          if (emp.id === id) {
            const newMonthlyStatus = [...(emp.monthlyStatus || Array(12).fill(''))];
            newMonthlyStatus[monthIndex] = convertedValue;
            
            // 変更後の状態をログ出力
            console.log(`ID=${id}の月次ステータス更新後:`, newMonthlyStatus);
            
            return { ...emp, monthlyStatus: newMonthlyStatus };
          }
          return emp;
        });
      });
      setErrorMessage(null);
    } else {
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
    }
  };

  // 新規行の月次ステータス更新ハンドラー
  const handleNewRowMonthlyStatusChange = (monthIndex: number, value: string) => {
    console.log(`新規行月次ステータス変更: 月=${monthIndex}, 値=${value}`);
    
    setInputValues(prev => ({
      ...prev,
      [`new-monthlyStatus-${monthIndex}`]: value
    }));
    
    if (value === "") {
      setNewRowData(prev => {
        const newMonthlyStatus = [...(prev.monthlyStatus || Array(12).fill(''))];
        newMonthlyStatus[monthIndex] = '';
        return {
          ...prev,
          monthlyStatus: newMonthlyStatus
        };
      });
      setErrorMessage(null);
      return;
    }
    
    const numValue = parseFloat(value);
    const validValues = [0, 0.5, 1, 2];
    
    if (isNaN(numValue) || !validValues.includes(numValue)) {
      setErrorMessage("月次ステータスには 0, 0.5, 1, 2 のいずれかを入力してください");
      return;
    }
    
    setNewRowData(prev => {
      const newMonthlyStatus = [...(prev.monthlyStatus || Array(12).fill(''))];
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
    
    if (!actualIsEditing) {
      setInternalIsEditing(true);
      
      if (onToggleEditMode) {
        onToggleEditMode();
      }
    }
    
    const nextNo = Math.max(...localEmployees.map(emp => emp.no || 0), 0) + 1;
    setNewRowData({
      ...defaultEmployee,
      no: nextNo
    });
    
    setIsAddingNewRow(true);
  };

  // 新規行のキャンセルハンドラー
  const handleCancelNewRow = () => {
    console.log('新規行追加をキャンセル');
    setIsAddingNewRow(false);
    setErrorMessage(null);
    setInputValues(prev => {
      const filtered = Object.keys(prev).reduce((acc, key) => {
        if (!key.startsWith('new-')) {
          acc[key] = prev[key];
        }
        return acc;
      }, {} as {[key: string]: any});
      return filtered;
    });
  };

  // 従業員データの削除ハンドラー
  const handleDeleteEmployee = async (id: number) => {
    console.log(`従業員削除ボタンがクリックされました: ID=${id}`);
    
    if (!window.confirm('この従業員データを削除してもよろしいですか？\n（バックアップが自動的に作成されます）')) {
      console.log('削除操作がキャンセルされました');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`従業員削除開始: ID=${id}`);
      
      // 新しい削除関数を使用
      const result = await deleteEmployeeFromDB(id);
      console.log('削除結果:', result);
      
      if (result.success) {
        // 削除成功時はUIを更新（すでにdeleteEmployeeFromDB内で実行されているが、念のため）
        setLocalEmployees(prev => prev.filter(emp => emp.id !== id));
        setOriginalEmployees(prev => prev.filter(emp => emp.id !== id));
        
        // 成功メッセージ
        setSuccessMessage(`従業員データを削除しました。バックアップ: ${result.backupPath}`);
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // データ更新通知
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        // 削除失敗
        setErrorMessage(result.message || '削除処理に失敗しました');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('従業員削除エラー:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // 新規行の保存ハンドラー
  const handleSaveNewRow = async () => {
    // 入力検証 - より詳細な検証
    const validationErrors: string[] = [];
    
    if (!newRowData.name) {
      validationErrors.push("名前は必須です");
    }
    
    if (!newRowData.employee_id) {
      validationErrors.push("社員IDは必須です");
    }
    
    // 複数の検証エラーがある場合は、それらを表示して終了
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join("、"));
      return Promise.reject(validationErrors.join("、"));
    }
    
    setIsLoading(true);
    
    try {
      console.log(`${fiscalYear}年に新規従業員データを作成します:`, newRowData);
      
      // APIを通じての作成を試みる
      // 深いコピーを作成して送信することで、オリジナルデータが失われないようにする
      const dataToSend = JSON.parse(JSON.stringify(newRowData));
      
      // カスタムプロパティを追加
      dataToSend._timestamp = new Date().toISOString(); // 一意性を確保するためのタイムスタンプ
      
      // 月パラメータは使用しないため0を渡す（APIの整合性のため）
      const createdEmployee = await reportApi.createEmployeeDetail(fiscalYear, 0, dataToSend);
      console.log(`作成された従業員データ:`, createdEmployee);
      
      // 応答データの検証と変換
      let newEmp: Employee;
      
      if (createdEmployee && createdEmployee.employee && createdEmployee.employee.id) {
        // APIから返された従業員データを使用
        newEmp = createdEmployee.employee as Employee;
        
        // 月次ステータスが配列でない場合は配列に変換
        if (!Array.isArray(newEmp.monthlyStatus)) {
          newEmp.monthlyStatus = Array(12).fill('');
        }
      } else {
        // フォールバック: クライアント側でデータを生成
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 1000);
        const tempId = parseInt(`${timestamp % 100000}${randomPart}`.substring(0, 6));
        
        newEmp = {
          ...newRowData,
          id: tempId,
          fiscal_year: fiscalYear,
          monthlyStatus: Array.isArray(newRowData.monthlyStatus) ? newRowData.monthlyStatus : Array(12).fill('')
        } as Employee;
        
        console.log('APIレスポンスからデータを取得できなかったため、クライアント側で生成:', newEmp);
      }
      
      // ローカル状態の更新
      setLocalEmployees(prev => [...prev, newEmp]);
      setOriginalEmployees(prev => [...prev, newEmp]);
      
      // 成功メッセージの表示 - 年度に応じてメッセージを変更
      if (fiscalYear >= 2024) {
        setSuccessMessage(`将来年度(${fiscalYear}年)の従業員データをクライアント側で作成しました (ID: ${newEmp.id})`);
        console.log(`新規従業員を保存しました: ID=${newEmp.id}, 名前=${newEmp.name}`);
      } else {
        setSuccessMessage('従業員データを作成しました');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // 新規追加モードを解除するが、入力値は保持する
      setIsAddingNewRow(false);
      
      // 成功した場合のみ入力値をクリア
      if (createdEmployee && (createdEmployee.success || createdEmployee.employee)) {
        console.log('データ保存成功: 入力値をクリアします');
        setNewRowData({...defaultEmployee}); // デフォルト値に戻す
        
        // 入力値をクリア
        setInputValues(prev => {
          const filtered = Object.keys(prev).reduce((acc, key) => {
            if (!key.startsWith('new-')) {
              acc[key] = prev[key];
            }
            return acc;
          }, {} as {[key: string]: any});
          return filtered;
        });
      } else {
        console.log('データ保存失敗: 入力値を保持します');
      }
      
      // 親コンポーネントへの通知
      if (onRefreshData) {
        console.log('親コンポーネントにデータ更新を通知');
        onRefreshData();
      }
      
      return Promise.resolve(newEmp);
    } catch (error: any) {
      console.error('従業員作成エラー:', error);
      
      // 拡張したエラーハンドリング関数を使用して適切なメッセージを表示
      setErrorMessage(reportApi.handleApiError(error));
      
      // 自動リトライの実装（2024年以降のデータに限り、クライアント側での保存を試みる）
      if (fiscalYear >= 2024) {
        console.log(`APIエラーが発生しましたが、将来年度(${fiscalYear}年)のデータなのでクライアント側で作成を試みます`);
        
        try {
          // タイムスタンプベースの一貫性のあるID生成
          const timestamp = new Date().getTime();
          const randomPart = Math.floor(Math.random() * 1000);
          const tempId = parseInt(`${timestamp % 100000}${randomPart}`.substring(0, 6));
          
          // 既存の従業員データから次のNo値を計算
          const existingNos = localEmployees.map(emp => emp.no || 0);
          const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0;
          const nextNo = maxNo + 1;
          
          console.log(`エラー時の新規従業員のNo生成: 既存No=${existingNos.join(',')}, 最大No=${maxNo}, 次のNo=${nextNo}`);
          
          const newEmp: Employee = {
            ...newRowData,
            id: tempId,
            no: nextNo, // 連番のNo値を設定
            fiscal_year: fiscalYear,
            monthlyStatus: Array.isArray(newRowData.monthlyStatus) ? newRowData.monthlyStatus : Array(12).fill('')
          } as Employee;
          
          // ローカル状態の更新
          setLocalEmployees(prev => [...prev, newEmp]);
          setOriginalEmployees(prev => [...prev, newEmp]);
          
          // ユーザーへのフィードバック
          setSuccessMessage(`APIエラーが発生しましたが、${fiscalYear}年のデータをクライアント側で作成しました`);
          setTimeout(() => {
            setSuccessMessage(null);
            setErrorMessage(null);
          }, 3000);
          
          // 新規追加モードを解除するが、入力値は保持する（エラー時は特に重要）
          setIsAddingNewRow(false);
          
          // 親コンポーネントへの通知
          if (onRefreshData) {
            onRefreshData();
          }
          
          return Promise.resolve(newEmp);
        } catch (fallbackError) {
          console.error('フォールバック処理中のエラー:', fallbackError);
          // フォールバック処理中にエラーが発生した場合は元のエラーを返す
          return Promise.reject(error);
        }
      }
      
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
    setIsLoading(true);
    console.log('従業員データ保存開始');
    console.log('保存するデータ件数:', localEmployees.length);
    console.log('=== デバッグ情報 ===');
    console.log('ストレージキー:', `EMPLOYEE_DATA_${fiscalYear}`);
    console.log('LocalStorage keys:', Object.keys(localStorage));
    setErrorMessage(null);
    
    try {
      const originalEmps = originalEmployees.length > 0 ? originalEmployees : [];
      const successfulUpdates: number[] = [];
      const failedUpdates: number[] = [];
      const skippedUpdates: number[] = []; // 変更がなかったものを追跡
      
      // 2024年以降のデータの場合は特別な処理
      const is2024OrLater = fiscalYear >= 2024;
      
      // 一括更新のための変更の事前計算
      const changesByEmployee: Record<number, Record<string, string>> = {};
      
      // すべての従業員の変更を検出
      for (const emp of localEmployees) {
        const originalEmp = originalEmps.find(e => e.id === emp.id);
        if (originalEmp) {
          const changedFields: Record<string, string> = {};
          
          // 各フィールドの変更を確認
          ['employee_id', 'name', 'disability_type', 'disability', 'grade', 'hire_date', 'status', 'memo', 'hc'].forEach(field => {
            // HC値がnumberの場合は文字列に変換して比較
            const originalValue = field === 'hc' 
              ? (originalEmp[field as keyof Employee] !== undefined ? String(originalEmp[field as keyof Employee]) : '') 
              : originalEmp[field as keyof Employee];
              
            const newValue = field === 'hc' 
              ? (emp[field as keyof Employee] !== undefined ? String(emp[field as keyof Employee]) : '') 
              : emp[field as keyof Employee];
              
            if (originalValue !== newValue) {
              // 値がundefinedやnullの場合は空文字列に変換
              const value = emp[field as keyof Employee];
              changedFields[field] = String(value !== undefined && value !== null ? value : '');
              
              // 詳細なログ出力（デバッグ用）
              console.log(`フィールド ${field} の変更検出:`, {
                original: originalEmp[field as keyof Employee], 
                new: emp[field as keyof Employee],
                processed: changedFields[field]
              });
            }
          });
          
          // 月次ステータスの変更を確認
          if (JSON.stringify(originalEmp.monthlyStatus) !== JSON.stringify(emp.monthlyStatus)) {
            changedFields['monthlyStatus'] = JSON.stringify(emp.monthlyStatus);
          }
          
          // 変更があれば追跡
          if (Object.keys(changedFields).length > 0) {
            changesByEmployee[emp.id] = changedFields;
          } else {
            skippedUpdates.push(emp.id);
          }
        }
      }
      
      console.log(`検出された変更: ${Object.keys(changesByEmployee).length}件`, changesByEmployee);
      
      // 2024年以降のデータの場合、localStorage に全データを保存
      if (is2024OrLater) {
        try {
          // StorageKeyを生成
          const storageKey = `EMPLOYEE_DATA_${fiscalYear}`;
          let savedEmployees = {};
          
          try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              savedEmployees = JSON.parse(savedData);
            }
          } catch (e) {
            console.error('ローカルストレージの読み取りエラー:', e);
          }
          
          // 現在のすべての従業員データを保存
          const allEmployeesForStorage = localEmployees.reduce((acc, emp) => {
            if (emp.id) {
              acc[emp.id] = {
                ...emp,
                fiscal_year: fiscalYear,
                updated_at: new Date().toISOString()
              };
            }
            return acc;
          }, {} as Record<number, any>);
          
          console.log(`ローカルストレージに保存するデータ:`, allEmployeesForStorage);
          
          // ローカルストレージに保存
          localStorage.setItem(storageKey, JSON.stringify(allEmployeesForStorage));
          
          // 保存が成功したか確認
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            const savedEmployeesObj = JSON.parse(savedData);
            const savedEmployeesCount = Object.keys(savedEmployeesObj).length;
            console.log(`${fiscalYear}年の従業員データをローカルストレージに保存しました`, savedEmployeesCount, '件');
            console.log('保存確認 - 保存されたデータキー:', Object.keys(savedEmployeesObj));
            
            // 保存後のデバッグ情報
            console.log('=== 保存後のデバッグ情報 ===');
            console.log('LocalStorage keys after save:', Object.keys(localStorage));
            console.log('現在のストレージキー:', storageKey);
            
            if (savedEmployeesCount === 0) {
              console.warn('ローカルストレージに保存されたデータが空です。再試行します。');
              // 再度保存を試みる
              localStorage.setItem(storageKey, JSON.stringify(allEmployeesForStorage));
              const retryData = localStorage.getItem(storageKey);
              if (!retryData || Object.keys(JSON.parse(retryData)).length === 0) {
                throw new Error('ローカルストレージへの保存に再試行しても失敗しました。');
              }
            }
            
            // 親コンポーネントに変更を通知
            if (onEmployeesUpdate) {
              console.log('親コンポーネントに従業員データ更新を通知:', localEmployees.length, '件');
              onEmployeesUpdate(localEmployees);
            }
            
            // すべての保存を成功として扱う
            successfulUpdates.push(...localEmployees.map(emp => emp.id));
          } else {
            console.error('ローカルストレージへの保存に失敗しました。ストレージキー:', storageKey);
            console.error('現在のローカルストレージキー一覧:', Object.keys(localStorage));
            throw new Error('ローカルストレージへの保存に失敗しました。');
          }
        } catch (storageError) {
          console.error('ローカルストレージへの保存エラー:', storageError);
          // エラーメッセージを設定
          setErrorMessage('ローカルストレージへの保存中にエラーが発生しました。');
          failedUpdates.push(...localEmployees.map(emp => emp.id));
        }
      } else {
        // 2023年以前のデータはAPI経由で更新
        // バッチ処理の最大サイズ
        const BATCH_SIZE = 5;
        const employeeIds = Object.keys(changesByEmployee).map(Number);
        
        // バッチ処理のために従業員IDをチャンクに分割
        for (let i = 0; i < employeeIds.length; i += BATCH_SIZE) {
          const batchIds = employeeIds.slice(i, i + BATCH_SIZE);
          console.log(`処理バッチ ${i / BATCH_SIZE + 1}: 従業員ID ${batchIds.join(', ')}`);
          
          // 並列処理のためのプロミス配列
          const updatePromises = batchIds.map(async (empId) => {
            const changedFields = changesByEmployee[empId];
            
            try {
              console.log(`従業員ID=${empId}の更新データ:`, changedFields);
              
              // API呼び出し
              const result = await reportApi.updateEmployeeData(fiscalYear, empId, changedFields);
              console.log(`従業員ID=${empId}の更新結果:`, result);
              
              // 親コンポーネントに変更を通知
              Object.entries(changedFields).forEach(([field, value]) => {
                onEmployeeChange(empId, field, value);
              });
              
              return { success: true, id: empId };
            } catch (error: any) {
              console.error(`従業員ID ${empId} の更新エラー:`, error);
              return { success: false, id: empId, error };
            }
          });
          
          // 各バッチの結果を処理
          const results = await Promise.allSettled(updatePromises);
          
          // 結果の集計
          results.forEach((result, index) => {
            const empId = batchIds[index];
            
            if (result.status === 'fulfilled') {
              if (result.value.success) {
                successfulUpdates.push(empId);
              } else {
                failedUpdates.push(empId);
              }
            } else {
              console.error(`従業員ID=${empId}の更新中に予期せぬエラーが発生:`, result.reason);
              failedUpdates.push(empId);
            }
          });
        }
      }
      
      // 結果に基づいてメッセージを表示
      let successMessage = '';
      let errorMessage: string | null = null;
      
      if (is2024OrLater) {
        // 2024年以降のデータの場合の特別なメッセージ
        if (successfulUpdates.length > 0) {
          successMessage = `${fiscalYear}年の従業員データ（${successfulUpdates.length}件）をクライアント側で保存しました`;
        }
      } else {
        // 通常の成功/失敗メッセージ
        if (failedUpdates.length > 0) {
          if (successfulUpdates.length > 0) {
            successMessage = `${successfulUpdates.length}件の従業員データを保存しました`;
            errorMessage = `${failedUpdates.length}件の従業員データの保存に失敗しました（ID: ${failedUpdates.join(', ')}）`;
          } else {
            errorMessage = `すべての従業員データの保存に失敗しました`;
          }
        } else if (successfulUpdates.length > 0) {
          successMessage = `すべての従業員データを正常に保存しました（${successfulUpdates.length}件）`;
        }
      }
      
      // 変更がなかった場合のメッセージ
      if (successfulUpdates.length === 0 && failedUpdates.length === 0) {
        successMessage = '変更はありませんでした';
      }
      
      // メッセージの設定
      if (successMessage) {
        setSuccessMessage(successMessage);
      }
      
      if (errorMessage) {
        setErrorMessage(errorMessage);
      }
      
      // 編集状態の更新
      onSaveSuccess();
      setInternalIsEditing(false);
      
      // データ再取得
      if (onRefreshData) {
        onRefreshData();
      }
      
      // 状態の更新
      setOriginalEmployees(JSON.parse(JSON.stringify(localEmployees)));
      setInputValues({});
      
      // 一定時間後にメッセージをクリア
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
    } catch (error: any) {
      console.error('従業員データ保存エラー:', error);
      
      // 拡張したエラーハンドリング関数を使用
      setErrorMessage(reportApi.handleApiError(error));
      
      // 2024年以降のデータの場合は、エラーがあってもUIからの編集を維持
      if (fiscalYear >= 2024) {
        // 元の状態を更新して変更を保持
        setOriginalEmployees(JSON.parse(JSON.stringify(localEmployees)));
        setSuccessMessage(`${fiscalYear}年のデータはクライアント側に保存されました`);
        
        // 編集状態の更新
        onSaveSuccess();
        setInternalIsEditing(false);
        
        // 一定時間後にメッセージをクリア
        setTimeout(() => {
          setSuccessMessage(null);
          setErrorMessage(null);
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // 年度選択リストを作成
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    yearOptions.push(year);
  }

  // デバッグ情報の出力
  console.log('[DEBUG] HC入力欄のレンダリング状態:', {
    従業員データ数: localEmployees.length,
    最初の従業員のHC値: localEmployees[0]?.hc,
    編集モード: isEditing,
    実際の編集モード: actualIsEditing
  });
  
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
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* 年度選択ドロップダウン */}
            <div>
              <label style={{ marginRight: '8px', fontSize: '0.9rem' }}>年度:</label>
              <select
                value={fiscalYear}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value, 10);
                  const previousYear = fiscalYear;
                  
                  console.log(`年度変更: ${previousYear} → ${newYear}`);
                  
                  // 基本的な年度変更処理
                  setFiscalYear(newYear);
                  
                  // 変更先の年度が次の年度の場合、データの引き継ぎ処理を行う
                  if (newYear === previousYear + 1) {
                    console.log(`次年度へのデータ引き継ぎを確認: ${previousYear} → ${newYear}`);
                    
                    // 現在のローカルストレージデータを確認
                    const nextYearStorageKey = `EMPLOYEE_DATA_${newYear}`;
                    const nextYearData = localStorage.getItem(nextYearStorageKey);
                    
                    if (!nextYearData) {
                      console.log(`${newYear}年度のデータが存在しないため、データ引き継ぎを実行します`);
                      
                      // 確認ダイアログを表示
                      if (window.confirm(`${previousYear}年度から${newYear}年度へデータを引き継ぎますか？`)) {
                        // 改良版のデータ引き継ぎ機能を使用
                        const result = checkAndInheritEmployeeData(previousYear, newYear);
                        
                        if (result.success) {
                          setSuccessMessage(result.message);
                          setTimeout(() => setSuccessMessage(null), 5000);
                        } else {
                          setErrorMessage(result.message);
                          setTimeout(() => setErrorMessage(null), 5000);
                        }
                      } else {
                        console.log('データ引き継ぎはユーザーによってキャンセルされました');
                      }
                    } else {
                      console.log(`${newYear}年度のデータが既に存在するため、データ引き継ぎをスキップします`);
                    }
                  }
                  
                  // データ取得処理
                  fetchEmployeesByYear(newYear);
                }}
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

            {/* データ引き継ぎと編集ボタン群 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isAddingNewRow && !actualIsEditing && (
                <>
                  {/* データ引き継ぎボタン */}
                  <button
                    type="button"
                    onClick={() => {
                      // 前年度からデータを引き継ぐ
                      const fromYear = fiscalYear - 1;
                      const toYear = fiscalYear;
                      
                      if (window.confirm(`${fromYear}年度から${toYear}年度へデータを引き継ぎますか？`)) {
                        // 改良版のデータ引き継ぎ機能を使用
                        manualInheritData(fromYear, toYear);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    title="前年度から現在年度へデータを引き継ぎます"
                  >
                    データ引き継ぎ
                  </button>
                  
                  {/* データ分析・削除テストボタンは削除 */}
                  
                  {/* 選択従業員削除ボタン */}
                  <button
                    type="button"
                    onClick={deleteSelectedEmployees}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    title="選択した従業員データを削除"
                    disabled={selectedCount === 0}
                  >
                    選択削除{selectedCount > 0 ? ` (${selectedCount})` : ''}
                  </button>
                </>
              )}
              
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
                  disabled={isLoading}
                >
                  編集
                </button>
              )}
              
              {/* CSVインポートボタン */}
              {!isAddingNewRow && (
                <button 
                  type="button"
                  onClick={() => setIsCSVImportModalOpen(true)}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#10b981', // 緑色
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '8px'
                  }}
                  disabled={isLoading}
                >
                  CSVインポート
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
                  disabled={isLoading || (actualIsEditing && isAddingNewRow)}
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

        {/* テーブルコンテナ */}
        <div style={{ 
          ...editingStyles,
          overflowX: 'auto',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #dee2e6',
          padding: '10px',
          marginBottom: '20px'
        }}>
          {/* 従業員データテーブル */}
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px', textAlign: 'center', width: '30px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={toggleSelectAll}
                    title="すべての行を選択/解除"
                  />
                </th>
                <th style={{ padding: '8px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>社員ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>氏名</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>障害区分</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>障害</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>等級</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>採用日</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>状態</th>
                <th style={{ padding: '8px', textAlign: 'left', minWidth: '140px' }}>WH</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>HC</th>
                {months.map((month, index) => (
                  <th key={`month-${index}`} style={{ padding: '8px', textAlign: 'center' }}>{month}</th>
                ))}
                <th style={{ padding: '8px', textAlign: 'left' }}>備考</th>
                <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>削除</th>
              </tr>
            </thead>
            <tbody>
              {/* 既存の従業員データ行 */}
              {localEmployees.map((employee, index) => (
                <tr key={employee.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={employee._selected || false}
                      onChange={() => toggleSelectEmployee(employee.id)}
                      title={`従業員 ${employee.name} を選択/解除`}
                    />
                  </td>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>
                    {actualIsEditing ? (
                      <input 
                        ref={(el) => { inputRefs.current[`${employee.id}-employee_id`] = el; }}
                        type="text" 
                        value={inputValues[`${employee.id}-employee_id`] ?? employee.employee_id ?? ''}
                        onChange={(e) => handleFieldChange(employee.id, 'employee_id', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `${employee.id}-employee_id`)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                        value={inputValues[`${employee.id}-name`] ?? employee.name ?? ''}
                        onChange={(e) => handleFieldChange(employee.id, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `${employee.id}-name`)}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                        value={inputValues[`${employee.id}-disability_type`] ?? employee.disability_type ?? ''}
                        onChange={(e) => handleFieldChange(employee.id, 'disability_type', e.target.value)}
                        style={{ 
                          width: '100px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                        value={inputValues[`${employee.id}-disability`] ?? employee.disability ?? ''}
                        onChange={(e) => handleFieldChange(employee.id, 'disability', e.target.value)}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                        value={inputValues[`${employee.id}-grade`] ?? employee.grade ?? ''}
                        onChange={(e) => handleFieldChange(employee.id, 'grade', e.target.value)}
                        style={{ 
                          width: '60px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                        value={(() => {
                          // Date input expects yyyy-MM-dd format
                          const hireDate = inputValues[`${employee.id}-hire_date`] || employee.hire_date || '';
                          if (!hireDate) return '';
                          
                          // Format: yyyy/MM/dd to yyyy-MM-dd
                          const dateParts = hireDate.split('/');
                          if (dateParts.length !== 3) return '';
                          
                          // Ensure year is 4 digits and properly formatted
                          let [year, month, day] = dateParts;
                          year = year.padStart(4, '0');
                          month = month.padStart(2, '0');
                          day = day.padStart(2, '0');
                          
                          return `${year}-${month}-${day}`;
                        })()}
                        onChange={(e) => {
                          if (e.target.value) {
                            // Convert from yyyy-MM-dd to yyyy/MM/dd for internal storage
                            const formattedDate = e.target.value.split('-').join('/');
                            handleFieldChange(employee.id, 'hire_date', formattedDate);
                          } else {
                            handleFieldChange(employee.id, 'hire_date', '');
                          }
                        }}
                        style={{ 
                          width: '120px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                        value={inputValues[`${employee.id}-status`] ?? employee.status ?? '在籍'}
                        onChange={(e) => handleFieldChange(employee.id, 'status', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `${employee.id}-status`)}
                        style={{ 
                          width: '80px',
                          padding: '4px',
                          border: '1px solid #ddd',
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
                  {/* WH入力欄（雇用形態） */}
                  <td style={{ padding: '8px', minWidth: '140px' }}>
                    {actualIsEditing ? (
                      <select 
                        ref={(el) => { inputRefs.current[`${employee.id}-wh`] = el; }}
                        value={inputValues[`${employee.id}-wh`] ?? employee.wh ?? '正社員'}
                        onChange={(e) => handleFieldChange(employee.id, 'wh', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `${employee.id}-wh`)}
                        style={{ 
                          width: '140px',
                          padding: '2px',
                          border: '1px solid #007bff',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      >
                        {WH_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      employee.wh || '正社員'
                    )}
                  </td>
                  {/* HC入力欄 */}
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    {/* デバッグログをJSX内に移動 */}
                    {(() => { console.log('[DEBUG] HC入力欄がレンダリングされました', { employeeId: employee.id, 状態: employee.status, 雇用形態: employee.wh || '正社員', HC値: employee.hc, 退職日: employee.retirement_date }); return null; })()}
                    <select 
                      ref={(el) => { inputRefs.current[`${employee.id}-hc`] = el; }}
                      value={inputValues[`${employee.id}-hc`] ?? (employee.hc === 0 ? '0' : (employee.hc || ''))}
                      onChange={(e) => {
                        console.log(`[DEBUG] HC値変更: ID=${employee.id}, 値=${e.target.value}`);
                        handleHcChange(employee.id, e.target.value);
                        
                        // HC値が変更された後に月次ステータスの計算を確実に実行
                        setTimeout(() => {
                          console.log(`[DEBUG] HC値変更後の確認: ID=${employee.id}`);
                          const updatedEmployee = localEmployees.find(emp => emp.id === employee.id);
                          if (updatedEmployee && updatedEmployee.hc !== undefined) {
                            updateMonthlyStatusFromHc(updatedEmployee);
                          }
                        }, 150);
                      }}
                      onBlur={(e) => {
                        // フォーカスを外したときも計算を再実行
                        handleHcChange(employee.id, e.target.value);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, `${employee.id}-hc`)}
                      style={{ 
                        width: '55px',
                        padding: '2px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        textAlign: 'center',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="">-</option>
                      <option value="0">0</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </td>
                  {/* 月次ステータス入力欄 */}
                  {(employee.monthlyStatus || Array(12).fill('')).map((status, monthIndex) => (
                    <td key={`${employee.id}-month-${monthIndex}`} style={{ padding: '4px', textAlign: 'center' }}>
                      {actualIsEditing ? (
                        <input 
                          ref={(el) => { inputRefs.current[`${employee.id}-monthlyStatus-${monthIndex}`] = el; }}
                          type="text" 
                          value={inputValues[`${employee.id}-monthlyStatus-${monthIndex}`] ?? (status === 0 ? '0' : status || '')}
                          onChange={(e) => handleMonthlyStatusChange(employee.id, monthIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, `${employee.id}-monthlyStatus-${monthIndex}`)}
                          style={{ 
                            width: '40px',
                            padding: '2px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center',
                            backgroundColor: '#fff'
                          }}
                        />
                      ) : (
                        status === 0 ? '0' : status || '-'
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '8px' }}>
                    {actualIsEditing ? (
                      <input 
                        ref={(el) => { inputRefs.current[`${employee.id}-memo`] = el; }}
                        type="text" 
                        value={inputValues[`${employee.id}-memo`] ?? employee.memo ?? ''}
                        onChange={(e) => handleFieldChange(employee.id, 'memo', e.target.value)}
                        style={{ 
                          width: '150px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ) : (
                      employee.memo || '-'
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {/* 編集モード中の削除ボタン */}
                      {actualIsEditing && (
                        <button
                          onClick={() => {
                            console.log(`削除ボタンがクリックされました: ID=${employee.id}, 名前=${employee.name}`);
                            handleDeleteEmployee(employee.id);
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          disabled={isLoading}
                          title="この従業員を削除"
                        >
                          削除
                        </button>
                      )}
                      
                      {/* 非編集モード時の削除アイコン */}
                      {!actualIsEditing && (
                        <button
                          onClick={() => {
                            console.log(`削除アイコンがクリックされました: ID=${employee.id}, 名前=${employee.name}`);
                            handleDeleteEmployee(employee.id);
                          }}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            color: '#dc3545',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                          disabled={isLoading}
                          title="この従業員を削除"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* 新規追加行 */}
              {isAddingNewRow && (
                <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#f8f9fa' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-employee_id`] = el; }}
                      type="text" 
                      value={inputValues[`new-employee_id`] ?? newRowData.employee_id ?? ''}
                      onChange={(e) => handleNewRowFieldChange('employee_id', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `new-employee_id`)}
                      placeholder="社員ID"
                      style={{ 
                        width: '60px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-name`] = el; }}
                      type="text" 
                      value={inputValues[`new-name`] ?? newRowData.name ?? ''}
                      onChange={(e) => handleNewRowFieldChange('name', e.target.value)}
                      placeholder="氏名"
                      style={{ 
                        width: '100px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select 
                      ref={(el) => { inputRefs.current[`new-disability_type`] = el; }}
                      value={inputValues[`new-disability_type`] ?? newRowData.disability_type ?? ''}
                      onChange={(e) => handleNewRowFieldChange('disability_type', e.target.value)}
                      style={{ 
                        width: '100px',
                        padding: '4px',
                        border: '1px solid #007bff',
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
                      value={inputValues[`new-disability`] ?? newRowData.disability ?? ''}
                      onChange={(e) => handleNewRowFieldChange('disability', e.target.value)}
                      placeholder="障害"
                      style={{ 
                        width: '80px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-grade`] = el; }}
                      type="text" 
                      value={inputValues[`new-grade`] ?? newRowData.grade ?? ''}
                      onChange={(e) => handleNewRowFieldChange('grade', e.target.value)}
                      placeholder="等級"
                      style={{ 
                        width: '60px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      ref={(el) => { inputRefs.current[`new-hire_date`] = el; }}
                      type="date"
                      value={(() => {
                        // Date input expects yyyy-MM-dd format
                        const hireDate = inputValues[`new-hire_date`] || newRowData.hire_date || '';
                        if (!hireDate) return '';
                        
                        // Format: yyyy/MM/dd to yyyy-MM-dd
                        const dateParts = hireDate.split('/');
                        if (dateParts.length !== 3) return '';
                        
                        // Ensure year is 4 digits and properly formatted
                        let [year, month, day] = dateParts;
                        year = year.padStart(4, '0');
                        month = month.padStart(2, '0');
                        day = day.padStart(2, '0');
                        
                        return `${year}-${month}-${day}`;
                      })()}
                      onChange={(e) => {
                        if (e.target.value) {
                          // Convert from yyyy-MM-dd to yyyy/MM/dd for internal storage
                          const formattedDate = e.target.value.split('-').join('/');
                          handleNewRowFieldChange('hire_date', formattedDate);
                        } else {
                          handleNewRowFieldChange('hire_date', '');
                        }
                      }}
                      style={{ 
                        width: '120px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select 
                      ref={(el) => { inputRefs.current[`new-status`] = el; }}
                      value={inputValues[`new-status`] ?? newRowData.status ?? '在籍'}
                      onChange={(e) => handleNewRowFieldChange('status', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `new-status`)}
                      style={{ 
                        width: '80px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="在籍">在籍</option>
                      <option value="休職">休職</option>
                      <option value="退職">退職</option>
                    </select>
                  </td>
                  {/* 新規行のWH入力欄（雇用形態） */}
                  <td style={{ padding: '8px', minWidth: '140px' }}>
                    <select 
                      ref={(el) => { inputRefs.current[`new-wh`] = el; }}
                      value={inputValues[`new-wh`] ?? newRowData.wh ?? '正社員'}
                      onChange={(e) => handleNewRowFieldChange('wh', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `new-wh`)}
                      style={{ 
                        width: '140px',
                        padding: '4px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      {WH_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* 新規行のHC入力欄 */}
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    {/* デバッグログをJSX内に移動 */}
                    {(() => { console.log('[DEBUG] 新規行HC入力欄がレンダリングされました', { 状態: newRowData.status, 雇用形態: newRowData.wh || '正社員', HC値: newRowData.hc }); return null; })()}
                    <select 
                      ref={(el) => { inputRefs.current[`new-hc`] = el; }}
                      value={inputValues[`new-hc`] ?? (newRowData.hc === 0 ? '0' : newRowData.hc || '')}
                      onChange={(e) => {
                        handleNewRowHcChange(e.target.value);
                        
                        // HC値変更後、月次ステータスを再計算
                        setTimeout(() => {
                          console.log(`[DEBUG] 新規行 HC値変更後の確認`);
                          updateMonthlyStatusForNewRow(newRowData);
                        }, 150);
                      }}
                      onBlur={(e) => handleNewRowHcChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `new-hc`)}
                      style={{ 
                        width: '55px',
                        padding: '2px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        textAlign: 'center',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="">-</option>
                      <option value="0">0</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </td>
                  {/* 新規行の月次ステータス入力欄 */}
                  {(newRowData.monthlyStatus || Array(12).fill('')).map((status, monthIndex) => (
                    <td key={`new-month-${monthIndex}`} style={{ padding: '4px', textAlign: 'center' }}>
                      <input 
                        ref={(el) => { inputRefs.current[`new-monthlyStatus-${monthIndex}`] = el; }}
                        type="text" 
                        value={inputValues[`new-monthlyStatus-${monthIndex}`] ?? (status === 0 ? '0' : status || '')}
                        onChange={(e) => handleNewRowMonthlyStatusChange(monthIndex, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `new-monthlyStatus-${monthIndex}`)}
                        style={{ 
                          width: '40px',
                          padding: '2px',
                          border: '1px solid #007bff',
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
                      value={inputValues[`new-memo`] ?? newRowData.memo ?? ''}
                      onChange={(e) => handleNewRowFieldChange('memo', e.target.value)}
                      placeholder="備考"
                      style={{ 
                        width: '150px',
                        padding: '4px',
                        border: '1px solid #007bff',
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
              onClick={handleCancelEdit}
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
              キャンセル
            </button>
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
              <li>HC: ヘッドカウント（頭数）を数値で入力してください。在籍中の場合は自動的にHC値が設定されます</li>
              <li>月次ステータス: 自動的にHC値が設定されますが、必要に応じて変更できます (使用可能値: 0, 0.5, 1, 2)</li>
              <li>採用日と状態に基づき、月次ステータスは自動的に計算されます</li>
              <li>状態が「退職」の場合、退職した月以降の値はクリアされます</li>
              <li>矢印キー（←→↑↓）で入力フィールド間を移動できます</li>
              <li>変更後は「変更を保存」ボタンを押してください</li>
            </ul>
          </div>
        )}
      </div>

      {/* CSVインポートモーダル */}
      <EmployeeCSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={() => setIsCSVImportModalOpen(false)}
        onImportSuccess={handleCSVImportSuccess}
        fiscalYear={fiscalYear}
      />
    </div>
  );
};

export default EmployeesTab;