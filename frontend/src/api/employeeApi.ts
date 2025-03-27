import apiClient from './client';

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  name_kana: string;
  gender: string;
  birth_date: string;
  hire_date: string;
  status: string;
  count: number;
  disability_type?: string;
  physical_verified?: boolean;
  intellectual_verified?: boolean;
  mental_verified?: boolean;
  // 他の属性
}

export const employeeApi = {
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