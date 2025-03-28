import apiClient from './client';
import { Employee } from '../types/Employee'; // 外部から型定義をインポート

export const employeeApi = {
  // getEmployees を追加（getAll の別名として機能）
  getEmployees: async (): Promise<Employee[]> => {
    try {
      const response = await apiClient.get('/employees');
      return response.data.data;
    } catch (error) {
      console.error('従業員データ取得エラー:', error);
      throw error;
    }
  },
  
  // 既存のメソッドも維持
  getAll: async (): Promise<Employee[]> => {
    try {
      const response = await apiClient.get('/employees');
      return response.data.data;
    } catch (error) {
      console.error('従業員データ取得エラー:', error);
      throw error;
    }
  },
  
  getById: async (id: number): Promise<Employee> => {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`従業員ID:${id}の取得エラー:`, error);
      throw error;
    }
  },
  
  create: async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    try {
      const response = await apiClient.post('/employees', employee);
      return response.data.data;
    } catch (error) {
      console.error('従業員作成エラー:', error);
      throw error;
    }
  },
  
  update: async (id: number, employee: Partial<Employee>): Promise<Employee> => {
    try {
      const response = await apiClient.put(`/employees/${id}`, employee);
      return response.data.data;
    } catch (error) {
      console.error(`従業員ID:${id}の更新エラー:`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch (error) {
      console.error(`従業員ID:${id}の削除エラー:`, error);
      throw error;
    }
  },
  
  // オブジェクト内にもエクスポート機能を維持
  exportEmployeesToCsv: async () => {
    try {
      const response = await apiClient.get('/employees/export', { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error('従業員データのCSVエクスポートエラー:', error);
      throw error;
    }
  }
};

// 独立したCSVエクスポート関数を追加
export const exportEmployeesToCsv = async () => {
  try {
    const response = await apiClient.get('/employees/export', { responseType: 'blob' });
    return response;
  } catch (error) {
    console.error('従業員データのCSVエクスポートエラー:', error);
    throw error;
  }
};

// Employee型を再エクスポート
export type { Employee };