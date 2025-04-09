// src/api/paymentReportApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// エラーハンドリング関数を改善
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const { status } = error.response;
      
      // ステータスコード別のメッセージ
      switch (status) {
        case 404:
          return 'データが見つかりません。別の年度を選択するか、新規作成してください。';
        case 500:
          return 'サーバーでエラーが発生しました。しばらく経ってから再度お試しください。';
        case 401:
          return '認証エラーが発生しました。ログインし直してください。';
        default:
          return `エラーが発生しました (${status})。サポートにお問い合わせください。`;
      }
    } else if (error.request) {
      return 'サーバーに接続できません。ネットワーク接続を確認してください。';
    } else {
      return `リクエストエラー: ${error.message}`;
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
  monthly_data?: string | any; // JSON文字列またはオブジェクト
  company_data?: string | any; // JSON文字列またはオブジェクト
  bank_info?: string | any;    // JSON文字列またはオブジェクト
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