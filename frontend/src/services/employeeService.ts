// src/services/employeeService.ts
import { fetchData, API_BASE_URL } from '../utils/apiConfig';

export const employeeService = {
  // 全従業員の取得
  getAllEmployees: async () => {
    return fetchData('/employees');
  },

  // ID別従業員取得
  getEmployeeById: async (id: number) => {
    return fetchData(`/employees/${id}`);
  },

  // 従業員の作成
  createEmployee: async (employeeData: any) => {
    return fetchData('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  },

  // 従業員の更新
  updateEmployee: async (id: number, employeeData: any) => {
    return fetchData(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  },

  // 従業員の削除
  deleteEmployee: async (id: number) => {
    return fetchData(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  // 従業員統計の取得
  getEmployeeStats: async () => {
    return fetchData('/employees/stats');
  },
};