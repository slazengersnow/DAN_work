// src/api/reportApi.ts
import axios, { AxiosError } from 'axios';
import { MonthlyTotal, Employee } from '../pages/MonthlyReport/types';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// エラーハンドリング関数 - ブラウザストレージエラー対応を追加
export const handleApiError = (error: any): string => {
  // ブラウザストレージアクセスエラーの特別処理
  if (error instanceof Error && 
    (error.message.includes('Access to storage is not allowed') || 
     error.message.includes('Could not find identifiable element'))) {
    console.log('ブラウザの設定による制限エラーです:', error.message);
    return 'ブラウザの設定により一部機能が制限されていますが、処理は続行されます。';
  }

  if (axios.isAxiosError(error)) {
    // 特定のエラーパターンに対する処理
    if (error.response && error.response.status === 500) {
      if (error.response.data && error.response.data.error &&
          error.response.data.error.includes('column "notes" of relation "monthly_reports" does not exist')) {
        return '現在のデータベーススキーマでは "notes" フィールドがサポートされていません。データを保存できません。';
      }
      return 'サーバーエラーが発生しました。しばらく経ってから再試行してください。';
    } else if (error.code === 'ECONNABORTED') {
      return 'リクエストがタイムアウトしました。ネットワーク接続を確認してください。';
    } else if (!error.response) {
      return 'サーバーに接続できませんでした。ネットワーク接続を確認してください。';
    }
    
    // 404エラーの特別処理
    if (error.response.status === 404) {
      return error.response.data.message || '指定されたデータが見つかりません。';
    }
    
    return `エラー (${error.response?.status || 'unknown'}): ${error.response?.data?.message || error.message}`;
  }
  
  return `予期せぬエラーが発生しました: ${error.message || error}`;
};

// 月次報告一覧を取得
export const getMonthlyReports = async () => {
  try {
    console.log(`月次レポート一覧取得: ${API_BASE_URL}/monthly-reports`);
    const response = await axios.get(
      `${API_BASE_URL}/monthly-reports`,
      {
        timeout: 10000
      }
    );
    console.log('月次レポート一覧取得結果:', response.data);
    return response.data.data || [];
  } catch (error) {
    console.error('月次レポート一覧取得エラー:', error);
    throw error;
  }
};

// 特定の年月の月次報告を取得
export const getMonthlyReport = async (year?: number, month?: number) => {
  try {
    // 年度または月が未定義の場合のデフォルト値を設定
    const validYear = year || new Date().getFullYear();
    const validMonth = month || new Date().getMonth() + 1;
    
    console.log(`月次レポート取得: ${API_BASE_URL}/monthly-reports/${validYear}/${validMonth}`);
    const response = await axios.get(
      `${API_BASE_URL}/monthly-reports/${validYear}/${validMonth}`,
      {
        timeout: 10000
      }
    );
    
    console.log('月次レポート取得結果:', response.data);
    return response.data;
  } catch (error) {
    console.error(`${year}年${month}月のレポート取得エラー:`, error);
    throw error;
  }
};

// 月次レポートを作成
export const createMonthlyReport = async (year: number, month: number, data: any) => {
  try {
    // データチェック
    if (!data.fiscal_year) {
      data.fiscal_year = year;
    }
    if (!data.month) {
      data.month = month;
    }
    
    // 小数点表示の修正
    if (data.legal_employment_rate !== undefined && typeof data.legal_employment_rate === 'number') {
      // 小数点以下が0なら追加
      if (data.legal_employment_rate === Math.floor(data.legal_employment_rate)) {
        data.legal_employment_rate = parseFloat(data.legal_employment_rate.toFixed(1));
      }
    }
    
    console.log(`月次レポート作成: ${API_BASE_URL}/monthly-reports`);
    console.log('作成データ:', JSON.stringify(data, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/monthly-reports`,
      data,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('月次レポート作成結果:', response.data);
    return response.data;
  } catch (error) {
    console.error(`${year}年${month}月のレポート作成エラー:`, error);
    throw error;
  }
};

// 月次レポートを更新
export const updateMonthlyReport = async (year: number, month: number, data: any) => {
  try {
    // 小数点表示の修正
    if (data.legal_employment_rate !== undefined && typeof data.legal_employment_rate === 'number') {
      // 小数点以下が0なら追加
      if (data.legal_employment_rate === Math.floor(data.legal_employment_rate)) {
        data.legal_employment_rate = parseFloat(data.legal_employment_rate.toFixed(1));
      }
    }
    
    console.log(`月次レポート更新: ${API_BASE_URL}/monthly-reports/${year}/${month}`);
    console.log('更新データ:', JSON.stringify(data, null, 2));
    
    const response = await axios.put(
      `${API_BASE_URL}/monthly-reports/${year}/${month}`,
      data,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('月次レポート更新結果:', response.data);
    return response.data;
  } catch (error) {
    console.error(`${year}年${month}月のレポート更新エラー:`, error);
    throw error;
  }
};

// 月次レポートのステータス更新（確定/未確定）
export const updateReportStatus = async (year: number, month: number, status: string) => {
  try {
    console.log(`レポートステータス更新: ${API_BASE_URL}/monthly-reports/${year}/${month}/confirm`);
    console.log('ステータス:', status);
    
    const response = await axios.put(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/confirm`,
      { status },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('レポートステータス更新結果:', response.data);
    return response.data;
  } catch (error) {
    console.error(`${year}年${month}月のレポートステータス更新エラー:`, error);
    throw error;
  }
};

// 従業員データの更新 - 改善版
export const updateEmployeeData = async (year: number, month: number, employeeId: number, data: Record<string, string>) => {
  try {
    console.log(`従業員更新API呼び出し: ${API_BASE_URL}/monthly-reports/${year}/${month}/employees/${employeeId}`);
    console.log('更新データ:', JSON.stringify(data, null, 2));
    
    // 月次ステータスの特別処理
    if (data.monthlyStatus) {
      try {
        // 文字列からJSONパースを試みる
        const monthlyStatus = JSON.parse(data.monthlyStatus);
        
        // 配列であることを確認
        if (!Array.isArray(monthlyStatus)) {
          throw new Error('月次ステータスが配列ではありません');
        }
        
        // 12ヶ月分のデータであることを確認
        if (monthlyStatus.length !== 12) {
          // 長さが足りない場合は足りない分を補完
          while (monthlyStatus.length < 12) {
            monthlyStatus.push(1);
          }
          // 長すぎる場合は切り詰め
          if (monthlyStatus.length > 12) {
            monthlyStatus.length = 12;
          }
          
          // 修正したデータを再度文字列化
          data.monthlyStatus = JSON.stringify(monthlyStatus);
        }
      } catch (parseError) {
        console.error('月次ステータス解析エラー:', parseError);
        // エラーが発生した場合はデフォルト値に設定
        data.monthlyStatus = JSON.stringify(Array(12).fill(1));
      }
    }
    
    // API呼び出し
    const response = await axios.patch(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/employees/${employeeId}`, 
      data,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('従業員更新API応答:', response.data);
    
    if (response.data && response.data.success) {
      return response.data.data || null;
    }
    
    throw new Error(response.data?.message || 'データの更新に失敗しました。');
  } catch (error) {
    console.error(`従業員ID ${employeeId} の更新エラー:`, error);
    
    // エラー処理
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('サーバーエラー:', error.response.status, error.response.data);
        throw new Error(error.response.data?.message || 'データの更新に失敗しました。');
      } else if (error.request) {
        throw new Error('サーバーからの応答がありません。ネットワーク接続を確認してください。');
      } else {
        throw new Error(`リクエスト設定エラー: ${error.message}`);
      }
    }
    
    throw error;
  }
};

// 従業員データの作成 - 改善版
export const createEmployeeDetail = async (year: number, month: number, employeeData: Omit<Employee, 'id'>) => {
  try {
    console.log(`従業員作成API呼び出し: ${API_BASE_URL}/monthly-reports/${year}/${month}/employees`);
    console.log('Request Body:', JSON.stringify(employeeData, null, 2));
    
    // 従業員データの前処理
    const processedData = {
      ...employeeData,
      // 月次ステータスが配列でない場合は配列に変換
      monthlyStatus: Array.isArray(employeeData.monthlyStatus) 
        ? employeeData.monthlyStatus 
        : Array(12).fill(1)
    };
    
    // API呼び出し
    const response = await axios.post(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/employees`, 
      processedData,
      {
        // タイムアウト設定を長めに
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('従業員作成API応答:', response.data);
    
    // 応答データの検証
    if (response.data && response.data.success) {
      // データを返す前に整形
      const responseData = response.data.data || null;
      
      if (responseData) {
        // IDが含まれているか確認
        if (!responseData.id) {
          console.warn('警告: API応答に従業員IDが含まれていません。仮IDを設定します。');
          responseData.id = Date.now(); // 仮IDを設定
        }
        
        // 月次ステータスが配列でない場合は配列に変換
        if (!Array.isArray(responseData.monthlyStatus)) {
          responseData.monthlyStatus = Array(12).fill(1);
        }
        
        return responseData;
      }
      
      // データがない場合は送信データにIDを付与して返す
      return {
        ...processedData,
        id: Date.now() // 仮IDを設定
      };
    }
    
    throw new Error(response.data?.message || 'データの作成に失敗しました。');
  } catch (error) {
    console.error('従業員作成エラー詳細:', error);
    
    // エラーの種類に応じた処理
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // サーバーからのエラーレスポンス
        console.error('サーバーエラー:', error.response.status, error.response.data);
        
        if (error.response.status === 404) {
          throw new Error('APIエンドポイントが見つかりません。バックエンドサービスを確認してください。');
        }
        
        if (error.response.status === 400) {
          throw new Error(`入力データエラー: ${error.response.data?.message || 'リクエストの形式が正しくありません'}`);
        }
        
        throw new Error(error.response.data?.message || '従業員データの作成に失敗しました。');
      } else if (error.request) {
        // リクエストは送信されたがレスポンスがない
        console.error('レスポンスなしエラー:', error.request);
        throw new Error('サーバーからの応答がありません。ネットワーク接続を確認してください。');
      } else {
        // リクエスト設定中のエラー
        console.error('リクエスト設定エラー:', error.message);
        throw new Error(`リクエスト設定エラー: ${error.message}`);
      }
    }
    
    // その他のエラー
    throw error;
  }
};

// データ存在チェック - 改善版
export const checkReportExists = async (year: number, month: number): Promise<boolean> => {
  try {
    console.log(`データ存在チェック: ${API_BASE_URL}/monthly-reports/${year}/${month}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/monthly-reports/${year}/${month}`,
      {
        timeout: 5000,
        validateStatus: (status) => {
          // 200番台は成功、404はデータ無しとして扱う
          return (status >= 200 && status < 300) || status === 404;
        }
      }
    );
    
    console.log('データ存在チェック結果:', response.status, response.data?.success);
    
    // ステータスコードとレスポンスの中身で存在確認
    return response.status === 200 && !!response.data && !!response.data.success;
  } catch (error) {
    console.error('データ存在チェックエラー:', error);
    
    // エラーが発生した場合は存在しないと判断
    return false;
  }
};

// 従業員データの削除
export const deleteEmployeeData = async (year: number, month: number, employeeId: number) => {
  try {
    console.log(`従業員削除: ${API_BASE_URL}/monthly-reports/${year}/${month}/employees/${employeeId}`);
    
    const response = await axios.delete(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/employees/${employeeId}`,
      {
        timeout: 5000
      }
    );
    
    console.log('従業員削除結果:', response.data);
    
    if (response.data && response.data.success) {
      return true;
    }
    
    throw new Error(response.data?.message || 'データの削除に失敗しました。');
  } catch (error) {
    console.error(`従業員ID ${employeeId} の削除エラー:`, error);
    throw error;
  }
};

// CSVインポート
export const importEmployeesFromCSV = async (year: number, month: number, fileData: FormData) => {
  try {
    console.log(`CSVインポート: ${API_BASE_URL}/monthly-reports/${year}/${month}/employees/import`);
    
    const response = await axios.post(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/employees/import`, 
      fileData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // CSVインポートは時間がかかる可能性があるため長めに設定
      }
    );
    
    console.log('CSVインポート結果:', response.data);
    
    if (response.data && response.data.success) {
      return response.data.data || null;
    }
    
    throw new Error(response.data?.message || 'CSVインポートに失敗しました。');
  } catch (error) {
    console.error('CSVインポートエラー:', error);
    throw error;
  }
};

// 月次サマリーを更新
export const updateMonthlySummary = async (
  year: number,
  month: number,
  data: Partial<MonthlyTotal> & { notes?: string }
) => {
  try {
    // notesフィールドを除去（型を拡張してnotesを許可）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { notes, ...cleanedData } = data as any;
    
    console.log(`月次サマリー更新: ${year}年${month}月`);
    console.log('更新データ:', cleanedData);
    
    // 現在のデータを取得（データが存在するかチェック）
    let existingData;
    try {
      existingData = await getMonthlyReport(year, month);
    } catch (error) {
      console.log('既存データなし、新規作成モードで続行します');
      existingData = null;
    }
    
    // データの存在によってエンドポイントを切り替え
    let endpoint;
    let method;
    let requestData = { ...cleanedData };
    
    if (existingData && existingData.summary) {
      // データが存在する場合は更新
      endpoint = `${API_BASE_URL}/monthly-reports/${year}/${month}/summary`;
      method = 'PUT';
    } else {
      // データが存在しない場合は作成
      endpoint = `${API_BASE_URL}/monthly-reports`;
      method = 'POST';
      
      // 新規作成の場合はfiscal_yearとmonthを追加
      requestData = {
        ...cleanedData,
        fiscal_year: year,
        month: month
      };
    }
    
    console.log(`APIリクエスト: ${method} ${endpoint}`);
    console.log('リクエストデータ:', requestData);
    
    // APIリクエスト
    const response = await axios({
      method: method,
      url: endpoint,
      data: requestData,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API応答:', response.data);
    return response.data;
  } catch (error) {
    console.error('API エラー:', error);
    throw new Error(handleApiError(error));
  }
};

// 詳細セルを更新
export const updateDetailCell = async (
  year: number,
  month: number,
  detailId: number,
  field: string,
  value: any
) => {
  try {
    console.log(`詳細セル更新: ${API_BASE_URL}/monthly-reports/${year}/${month}/details/${detailId}`);
    console.log('更新フィールド:', field, '値:', value);
    
    const response = await axios.put(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/details/${detailId}`,
      { [field]: value },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('詳細セル更新結果:', response.data);
    return response.data;
  } catch (error) {
    console.error(`詳細セル更新エラー:`, error);
    throw new Error(handleApiError(error));
  }
};

// 月次レポートを確認（確定）
export const confirmMonthlyReport = async (year: number, month: number) => {
  try {
    console.log(`レポート確定: ${API_BASE_URL}/monthly-reports/${year}/${month}/confirm`);
    
    const response = await axios.post(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/confirm`,
      {},
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('レポート確定結果:', response.data);
    return response.data;
  } catch (error) {
    console.error(`レポート確定エラー:`, error);
    throw new Error(handleApiError(error));
  }
};

// システム設定を取得する関数
export const getSettings = async (): Promise<any> => {
  try {
    console.log(`設定取得: ${API_BASE_URL}/settings`);
    
    const response = await axios.get(
      `${API_BASE_URL}/settings`,
      {
        timeout: 5000
      }
    );
    
    console.log('設定取得結果:', response.data);
    return response.data;
  } catch (error) {
    console.error('設定の取得中にエラーが発生しました:', error);
    throw new Error(handleApiError(error));
  }
};

// API関数をまとめたオブジェクト
export const reportApi = {
  getMonthlyReports,
  getMonthlyReport,
  updateEmployeeData,
  updateReportStatus,
  updateMonthlySummary,
  createMonthlyReport,
  updateMonthlyReport,
  createEmployeeDetail,
  checkReportExists,
  deleteEmployeeData,
  importEmployeesFromCSV,
  handleApiError,
  updateDetailCell,
  confirmMonthlyReport,
  getSettings
};

export default reportApi;