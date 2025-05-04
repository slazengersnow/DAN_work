import apiClient from './client';
import { Employee } from '../types/Employee';

export const employeeApi = {
  // 年度を指定して従業員データを取得
  getEmployeesByYear: async (year: number): Promise<Employee[]> => {
    try {
      const response = await apiClient.get(`/employees?year=${year}`);
      return response.data.data;
    } catch (error) {
      console.error(`年度 ${year} の従業員データ取得エラー:`, error);
      throw error;
    }
  },
  
  // すべての従業員データを取得
  getAll: async (): Promise<Employee[]> => {
    try {
      const response = await apiClient.get('/employees');
      return response.data.data;
    } catch (error) {
      console.error('従業員データ取得エラー:', error);
      throw error;
    }
  },
  
  // IDで従業員データを取得
  getById: async (id: number): Promise<Employee> => {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`従業員ID:${id}の取得エラー:`, error);
      throw error;
    }
  },
  
  // 従業員データを作成
  create: async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    try {
      const response = await apiClient.post('/employees', employee);
      return response.data.data;
    } catch (error) {
      console.error('従業員作成エラー:', error);
      throw error;
    }
  },
  
  // 従業員データを更新
  update: async (id: number, employee: Partial<Employee>): Promise<Employee> => {
    try {
      const response = await apiClient.put(`/employees/${id}`, employee);
      return response.data.data;
    } catch (error) {
      console.error(`従業員ID:${id}の更新エラー:`, error);
      throw error;
    }
  },
  
  // 従業員データを削除
  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch (error) {
      console.error(`従業員ID:${id}の削除エラー:`, error);
      throw error;
    }
  },
  
  // 月次レポートに従業員を追加
  createEmployeeForMonthlyReport: async (year: number, month: number, employee: Omit<Employee, 'id'>): Promise<Employee> => {
    try {
      const response = await apiClient.post(`/monthly-reports/${year}/${month}/employee`, employee);
      return response.data.data;
    } catch (error) {
      console.error(`${year}年${month}月への従業員追加エラー:`, error);
      throw error;
    }
  },
  
  // CSVエクスポート
  exportToCsv: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/employees/export', { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error('従業員データのCSVエクスポートエラー:', error);
      throw error;
    }
  }
};

// 既存の関数をエクスポート（後方互換性のため）
export const getEmployees = employeeApi.getAll;
export const exportEmployeesToCsv = employeeApi.exportToCsv;

export default employeeApi;