// src/api/paymentReportApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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

// 納付金レポートの型定義
export interface PaymentReport {
  id?: number;
  year: number;
  total_employees: number;
  disabled_employees: number;
  employment_rate: number;
  legal_employment_rate: number;
  shortage_count: number;
  payment_amount: number;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// 計算結果の型定義
export interface PaymentCalculation {
  year: number;
  avg_total_employees: number;
  avg_disabled_employees: number;
  actual_employment_rate: number;
  legal_employment_rate: number;
  legal_employment_count: number;
  shortage_count: number;
  payment_unit: number;
  payment_amount: number;
}

// すべての納付金レポートを取得
export const getAllPaymentReports = async (): Promise<PaymentReport[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment-reports`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 特定年度の納付金レポートを取得
export const getPaymentReport = async (year: number): Promise<PaymentReport> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment-reports/${year}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 納付金レポートを保存（新規作成または更新）
export const savePaymentReport = async (year: number, data: Partial<PaymentReport>): Promise<PaymentReport> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/payment-reports/${year}`, data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 納付金レポートを削除
export const deletePaymentReport = async (year: number): Promise<{ message: string; report: PaymentReport }> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/payment-reports/${year}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 納付金額を計算
export const calculatePayment = async (year: number): Promise<PaymentCalculation> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment-reports/${year}/calculate`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// 納付金レポートを確定
export const confirmPaymentReport = async (year: number): Promise<{ message: string; report: PaymentReport }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/payment-reports/${year}/confirm`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// APIをまとめてエクスポート
export const paymentReportApi = {
  getAllPaymentReports,
  getPaymentReport,
  savePaymentReport,
  deletePaymentReport,
  calculatePayment,
  confirmPaymentReport
};

export default paymentReportApi;