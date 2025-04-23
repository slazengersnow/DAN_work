// src/api/reportApi.ts
import axios from 'axios';
import { MonthlyTotal, MonthlyDetailData, Employee } from '../pages/MonthlyReport/types';
import client from './client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// エラーハンドリング関数
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // サーバーからのレスポンスがある場合
      const { status, data } = error.response;
      console.error('API Error Response:', status, data); // 詳細ログ追加
      if (typeof data === 'string') {
        return `エラー (${status}): ${data}`;
      } else if (data && data.message) {
        return `エラー (${status}): ${data.message}`;
      } else {
        return `エラー (${status}): サーバーエラーが発生しました`;
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない場合
      console.error('API No Response:', error.request); // 詳細ログ追加
      return 'サーバーに接続できません。ネットワーク接続を確認してください。';
    } else {
      // リクエスト設定時にエラーが発生した場合
      return `エラー: ${error.message}`;
    }
  }
  return `予期せぬエラーが発生しました: ${error}`;
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

// 特定の年月の月次報告を取得（年月が指定されない場合は現在の年月を使用）
export const getMonthlyReport = async (year?: number, month?: number) => {
  try {
    // 年度または月が未定義の場合のデフォルト値を設定
    const validYear = year || new Date().getFullYear();
    const validMonth = month || new Date().getMonth() + 1;
    
    const response = await axios.get(`${API_BASE_URL}/monthly-reports/${validYear}/${validMonth}`);
    return response.data;
  } catch (error) {
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
  data: Partial<MonthlyTotal>
) => {
  try {
    console.log(`API呼び出し: ${year}年${month}月のデータを更新します`, data);
    
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
    
    if (existingData && existingData.summary) {
      // データが存在する場合は更新
      endpoint = `${API_BASE_URL}/monthly-reports/${year}/${month}/summary`;
      method = 'PUT';
    } else {
      // データが存在しない場合は作成
      endpoint = `${API_BASE_URL}/monthly-reports`;
      method = 'POST';
      
      // 新規作成の場合はfiscal_yearとmonthを追加
      data = {
        ...data,
        fiscal_year: year,
        month: month
      };
    }
    
    console.log(`APIリクエスト: ${method} ${endpoint}`, data);
    
    // APIリクエスト
    const response = await axios({
      method: method,
      url: endpoint,
      data: data
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

// 月次レポートを新規作成する関数 (新実装)
export const createMonthlyReport = async (fiscalYear: number, month: number, data: any) => {
  try {
    const response = await client.post('/monthly-reports', {
      fiscal_year: fiscalYear,
      month: month,
      employees_count: data.data[0].values[month - 1], // 4月なら3のインデックス
      fulltime_count: data.data[1].values[month - 1],
      parttime_count: data.data[2].values[month - 1],
      level1_2_count: data.data[4].values[month - 1],
      other_disability_count: data.data[5].values[month - 1],
      level1_2_parttime_count: data.data[6].values[month - 1],
      other_parttime_count: data.data[7].values[month - 1],
      legal_employment_rate: data.data[10].values[month - 1]
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// 月次レポートを更新する関数 (新実装)
export const updateMonthlyReport = async (fiscalYear: number, month: number, data: any) => {
  try {
    const response = await client.put(`/monthly-reports/${fiscalYear}/${month}`, {
      fiscal_year: fiscalYear,
      month: month,
      employees_count: data.data[0].values[month - 1],
      fulltime_count: data.data[1].values[month - 1],
      parttime_count: data.data[2].values[month - 1],
      level1_2_count: data.data[4].values[month - 1],
      other_disability_count: data.data[5].values[month - 1],
      level1_2_parttime_count: data.data[6].values[month - 1],
      other_parttime_count: data.data[7].values[month - 1],
      legal_employment_rate: data.data[10].values[month - 1]
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
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

// APIのエクスポート
export const reportApi = {
  getMonthlyReports,
  getMonthlyReport,
  updateEmployeeData,
  updateDetailCell,
  updateMonthlySummary,
  confirmMonthlyReport,
  createMonthlyReport, // 新実装に置き換え
  updateMonthlyReport, // 新機能として追加
  createEmployeeDetail,
  directApiRequest,
  handleApiError
};

export default reportApi;