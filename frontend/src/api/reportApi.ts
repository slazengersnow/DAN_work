import axios from 'axios';
import { MonthlyTotal, MonthlyDetailData, Employee } from '../pages/MonthlyReport/types';
import client from './client';

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
      // バックエンドエラーの場合
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
    const response = await axios.get(`${API_BASE_URL}/monthly-reports`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 特定の年月の月次報告を取得（エラーハンドリング強化）
export const getMonthlyReport = async (year?: number, month?: number) => {
  try {
    // 年度または月が未定義の場合のデフォルト値を設定
    const validYear = year || new Date().getFullYear();
    const validMonth = month || new Date().getMonth() + 1;
    
    console.log(`\n        \n        \n       GET ${API_BASE_URL}/monthly-reports/${validYear}/${validMonth}`);
    const response = await axios.get(`${API_BASE_URL}/monthly-reports/${validYear}/${validMonth}`);
    return response.data;
  } catch (error) {
    // 404エラーの場合は明示的にエラーメッセージを設定
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.error(`指定された月次レポートが見つかりません: ${year}年${month}月`);
      throw new Error(`指定された月次レポート (${year}年${month}月) が見つかりません。`);
    }
    throw new Error(handleApiError(error));
  }
};

// 従業員データを更新
export const updateEmployeeData = async (
  year: number,
  month: number,
  employee_id: number,
  data: Partial<MonthlyTotal>
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/employees/${employee_id}`,
      data
    );
    return response.data;
  } catch (error) {
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
    const response = await axios.put(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/details/${detailId}`,
      { [field]: value }
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 月次サマリーを更新（強化版）
export const updateMonthlySummary = async (
  year: number,
  month: number,
  data: Partial<MonthlyTotal> & { notes?: string }
) => {
  try {
    // notesフィールドを除去（型を拡張してnotesを許可）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { notes, ...cleanedData } = data as any;
    
    console.log(`API呼び出し: ${year}年${month}月のデータを更新します`, cleanedData);
    
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
    
    console.log(`APIリクエスト: ${method} ${endpoint}`, requestData);
    
    // APIリクエスト
    const response = await axios({
      method: method,
      url: endpoint,
      data: requestData
    });
    
    console.log('API応答:', response.data);
    return response.data;
  } catch (error) {
    console.error('API エラー:', error);
    throw new Error(handleApiError(error));
  }
};

// 月次報告を確認（確定）
export const confirmMonthlyReport = async (year: number, month: number) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/confirm`
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 月次レポートを新規作成する関数 - 改善版
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
    
    const response = await axios.post(`${API_BASE_URL}/monthly-reports`, data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 月次レポートを更新する関数 - 改善版
export const updateMonthlyReport = async (year: number, month: number, data: any) => {
  try {
    // 小数点表示の修正
    if (data.legal_employment_rate !== undefined && typeof data.legal_employment_rate === 'number') {
      // 小数点以下が0なら追加
      if (data.legal_employment_rate === Math.floor(data.legal_employment_rate)) {
        data.legal_employment_rate = parseFloat(data.legal_employment_rate.toFixed(1));
      }
    }
    
    const response = await axios.put(`${API_BASE_URL}/monthly-reports/${year}/${month}`, data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 新規従業員詳細の作成
export const createEmployeeDetail = async (
  year: number,
  month: number,
  employeeData: Partial<Employee>
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/employees/create`,
      employeeData
    );
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// データ存在チェック（新規追加）
export const checkReportExists = async (year: number, month: number): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/monthly-reports/${year}/${month}`);
    return !!response.data && !!response.data.success;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error('データ存在チェックエラー:', error);
    return false;
  }
};

// 直接PUT/POSTリクエストを作成する関数（デバッグおよびテスト用）
export const directApiRequest = async (
  method: string,
  url: string,
  data: any
) => {
  try {
    console.log(`直接APIリクエスト: ${method} ${url}`, data);
    
    const response = await axios({
      method: method,
      url: url,
      data: data
    });
    
    console.log('API応答:', response.data);
    return response.data;
  } catch (error) {
    console.error('直接API呼び出しエラー:', error);
    throw new Error(handleApiError(error));
  }
};

// システム設定を取得する関数
export const getSettings = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/settings`);
    return response.data;
  } catch (error) {
    console.error('設定の取得中にエラーが発生しました:', error);
    throw new Error(handleApiError(error));
  }
};

// APIのエクスポート
export const reportApi = {
  getMonthlyReports,
  getMonthlyReport,
  updateEmployeeData,
  updateDetailCell,
  updateMonthlySummary,
  confirmMonthlyReport,
  createMonthlyReport,
  updateMonthlyReport,
  createEmployeeDetail,
  directApiRequest,
  handleApiError,
  getSettings,
  checkReportExists
};

export default reportApi;