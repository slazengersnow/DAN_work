// frontend/src/api/reportApi.ts
import apiClient from './client';
import { Employee } from './employeeApi'; // 必要に応じてインポート

export interface MonthlyData {
  id: number;
  year: number;
  month: number;
  total_employees: number;
  full_time_employees: number;
  part_time_employees: number;
  disabled_employees: number;
  actual_rate: number;
  legal_rate: number;
  legal_count: number;
  shortage: number;
  status: string;
}

export interface MonthlyEmployee {
  id: number;
  employee_id: string;
  name: string;
  disability_type: string;
  grade: string;
  hire_date: string;
  status: string;
  count: number;
  monthlyWork: {
    scheduled_hours: number;
    actual_hours: number;
    exception_reason: string;
  };
}

export const reportApi = {
  getMonthlyData: async (year: number, month: number): Promise<MonthlyData> => {
    try {
      const response = await apiClient.get('/reports/monthly', {
        params: { year, month }
      });
      return response.data.data;
    } catch (error) {
      console.error('月次データ取得エラー:', error);
      throw error;
    }
  },
  
  getEmployeesByMonth: async (year: number, month: number): Promise<MonthlyEmployee[]> => {
    try {
      const response = await apiClient.get('/reports/monthly/employees', {
        params: { year, month }
      });
      return response.data.data;
    } catch (error) {
      console.error('月次従業員データ取得エラー:', error);
      throw error;
    }
  },
  
  getYearlyData: async (year: number): Promise<MonthlyData[]> => {
    try {
      const response = await apiClient.get('/reports/yearly', {
        params: { year }
      });
      return response.data.data;
    } catch (error) {
      console.error('年間データ取得エラー:', error);
      throw error;
    }
  },
  
  confirmMonthlyData: async (year: number, month: number): Promise<MonthlyData> => {
    try {
      const response = await apiClient.post('/reports/monthly/confirm', {
        year, month
      });
      return response.data.data;
    } catch (error) {
      console.error('月次データ確定エラー:', error);
      throw error;
    }
  },
  
  updateEmployee: async (id: number, data: Partial<Employee>) => {
    try {
      const response = await apiClient.put(`/reports/employees/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`従業員ID:${id}の更新エラー:`, error);
      throw error;
    }
  },
  
  updateMonthlyDetail: async (year: number, month: number, data: any) => {
    try {
      const response = await apiClient.put(`/reports/${year}/${month}/details`, data);
      return response.data;
    } catch (error) {
      console.error(`${year}年${month}月の詳細データ更新エラー:`, error);
      throw error;
    }
  },
  
  exportCsv: async (year: number, month: number) => {
    try {
      const response = await apiClient.get(`/reports/${year}/${month}/export`, { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error(`${year}年${month}月のCSVエクスポートエラー:`, error);
      throw error;
    }
  },
  
  generatePdf: async (year: number, month: number) => {
    try {
      const response = await apiClient.get(`/reports/${year}/${month}/pdf`, { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error(`${year}年${month}月のPDF生成エラー:`, error);
      throw error;
    }
  }
};