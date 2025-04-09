// src/api/reportApi.ts
import axios from 'axios';
import { MonthlyTotal, MonthlyDetailData } from '../pages/MonthlyReport/types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// エラーハンドリング関数
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // サーバーからのレスポンスがある場合
      const { status, data } = error.response;
      if (typeof data === 'string') {
        return `エラー (${status}): ${data}`;
      } else if (data && data.message) {
        return `エラー (${status}): ${data.message}`;
      } else {
        return `エラー (${status}): サーバーエラーが発生しました`;
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない場合
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

// 月次サマリーを更新
export const updateMonthlySummary = async (
  year: number,
  month: number,
  data: Partial<MonthlyTotal>
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/monthly-reports/${year}/${month}/summary`,
      data
    );
    return response.data;
  } catch (error) {
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

// APIのエクスポート
export const reportApi = {
  getMonthlyReports,
  getMonthlyReport,
  updateEmployeeData,
  updateDetailCell,
  updateMonthlySummary,
  confirmMonthlyReport,
  handleApiError
};

export default reportApi;