// frontend/src/api/reportApi.ts
import apiClient from './client';

export interface MonthlyData {
  id?: number;
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

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  disability_type?: string;
  grade?: string;
  status: string;
  count: number;
  monthlyWork?: {
    scheduled_hours: number;
    actual_hours: number;
    exception_reason?: string;
  };
}

export const reportApi = {
  // 月次データ取得
  getMonthlyData: async (year: number, month: number): Promise<MonthlyData> => {
    try {
      const response = await apiClient.get(`/reports/monthly/${year}/${month}`);
      return response.data;
    } catch (error) {
      console.error(`月次データ取得エラー: ${year}年${month}月`, error);
      throw error;
    }
  },
  
  // 月次従業員データ取得
  getEmployeesByMonth: async (year: number, month: number): Promise<Employee[]> => {
    try {
      const response = await apiClient.get(`/reports/monthly/${year}/${month}/employees`);
      return response.data;
    } catch (error) {
      console.error(`月次従業員データ取得エラー: ${year}年${month}月`, error);
      throw error;
    }
  },
  
  // 年間データ取得
  getYearlyData: async (year: number): Promise<MonthlyData[]> => {
    try {
      const response = await apiClient.get(`/reports/yearly/${year}`);
      return response.data;
    } catch (error) {
      console.error(`年間データ取得エラー: ${year}年`, error);
      throw error;
    }
  },
  
  // 月次データ確定
  confirmMonthlyData: async (year: number, month: number): Promise<MonthlyData> => {
    try {
      const response = await apiClient.post(`/reports/monthly/${year}/${month}/confirm`);
      return response.data;
    } catch (error) {
      console.error(`月次データ確定エラー: ${year}年${month}月`, error);
      throw error;
    }
  },
  
  // 月次詳細データ更新
  updateMonthlyDetail: async (year: number, month: number, data: any): Promise<MonthlyData> => {
    try {
      const response = await apiClient.put(`/reports/monthly/${year}/${month}/detail`, data);
      return response.data;
    } catch (error) {
      console.error(`月次詳細データ更新エラー: ${year}年${month}月`, error);
      throw error;
    }
  },
  
  // 新規追加: 月次レポートCSVエクスポート
  exportMonthlyReportToCsv: async (year: number, month: number): Promise<void> => {
    try {
      const response = await apiClient.get('/reports/monthly/export', {
        params: { year, month },
        responseType: 'blob'
      });
      
      // Blobからファイルを作成してダウンロード
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly_report_${year}_${month}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('月次レポートCSVエクスポートエラー:', error);
      throw error;
    }
  }
};

// 提案されたスタンドアロン関数もエクスポート（互換性のため）
export const exportMonthlyReportToCsv = reportApi.exportMonthlyReportToCsv;