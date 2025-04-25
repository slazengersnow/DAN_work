// src/utils/databaseValidator.js

import axios from 'axios';

class DatabaseValidator {
  constructor() {
    this.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    this.requiredFields = {
      monthly_reports: [
        'id',
        'fiscal_year',
        'month',
        'employees_count',
        'fulltime_count',
        'parttime_count',
        'level1_2_count',
        'other_disability_count',
        'level1_2_parttime_count',
        'other_parttime_count',
        'total_disability_count',
        'employment_rate',
        'legal_employment_rate',
        'required_count',
        'over_under_count',
        'status',
        // 'notes' フィールドが存在していない
      ]
    };
  }
  
  // APIを通じてテーブル構造を検証
  async validateTableStructure(tableName) {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/schema/validate/${tableName}`);
      return response.data;
    } catch (error) {
      console.error(`テーブル ${tableName} の構造検証に失敗:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // モデルを修正してnotesフィールドを除外
  fixMonthlyReportModel(data) {
    // notesフィールドが含まれている場合は削除
    if (data.notes !== undefined) {
      const { notes, ...fixedData } = data;
      console.log('notesフィールドを除外しました');
      return fixedData;
    }
    return data;
  }
  
  // 互換性を確保するためのデータ変換
  transformDataForAPI(data, tableName) {
    switch (tableName) {
      case 'monthly_reports':
        return this.fixMonthlyReportModel(data);
      default:
        return data;
    }
  }
}

export default new DatabaseValidator();