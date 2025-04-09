// src/services/paymentReportService.ts

import axios from 'axios';

// インラインでの型定義（オプション3）
export interface MonthlyData {
  month: number;
  total_employees: number;
  disabled_employees: number;
  employment_rate: number;
}

export interface PaymentReport {
  id?: number;
  fiscal_year: number;
  company_name: string;
  company_address?: string;
  representative_name?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  adjustment_amount?: number;
  average_employee_count: number;
  legal_employment_count: number;
  actual_employment_count: number;
  shortage_count: number;
  payment_amount: number;
  status?: string;
  submitted_date?: string | null;
  notes?: string;
  monthly_data: MonthlyData[];
  created_at?: string;
  updated_at?: string;
}

export interface PaymentCalculation {
  average_employee_count: number;
  legal_employment_count: number;
  actual_employment_count: number;
  shortage_count: number;
  payment_amount: number;
  legal_employment_rate?: number;
  payment_unit_price?: number;
}

const API_URL = '/api/payment-reports';

export const paymentReportService = {
  // 全ての納付金レポートリストの取得
  getAllPaymentReports: async (): Promise<PaymentReport[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // 特定の納付金レポートの取得
  getPaymentReport: async (fiscalYear: number): Promise<PaymentReport> => {
    const response = await axios.get(`${API_URL}/${fiscalYear}`);
    return response.data;
  },

  // 新規納付金レポートの作成
  createNewPaymentReport: async (fiscalYear: number): Promise<PaymentReport> => {
    const response = await axios.post(`${API_URL}/create/${fiscalYear}`);
    return response.data;
  },

  // 納付金レポートの保存
  savePaymentReport: async (fiscalYear: number, reportData: PaymentReport): Promise<PaymentReport> => {
    const response = await axios.post(`${API_URL}/${fiscalYear}`, reportData);
    return response.data;
  },

  // 納付金レポートの更新
  updatePaymentReport: async (fiscalYear: number, reportData: PaymentReport): Promise<PaymentReport> => {
    const response = await axios.put(`${API_URL}/${fiscalYear}`, reportData);
    return response.data;
  },

  // 納付金レポートの提出
  submitPaymentReport: async (fiscalYear: number): Promise<PaymentReport> => {
    const response = await axios.post(`${API_URL}/${fiscalYear}/submit`);
    return response.data;
  },

  // 納付金レポートの削除
  deletePaymentReport: async (fiscalYear: number): Promise<PaymentReport> => {
    const response = await axios.delete(`${API_URL}/${fiscalYear}`);
    return response.data;
  },

  // 納付金額計算（シミュレーション）
  calculatePaymentAmount: async (employeeCount: number, disabledEmployeeCount: number): Promise<PaymentCalculation> => {
    const response = await axios.post(`${API_URL}/calculate`, {
      employeeCount,
      disabledEmployeeCount
    });
    return response.data;
  }
};