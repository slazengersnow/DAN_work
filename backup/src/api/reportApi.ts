// frontend/src/api/reportApi.ts
import apiClient from './client';

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
  }
};