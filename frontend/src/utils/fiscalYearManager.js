// src/utils/fiscalYearManager.js

import storageManager from './storageManager';

class FiscalYearManager {
  constructor() {
    this.currentFiscalYear = new Date().getFullYear();
    this.activeMonthlyData = new Map();
  }
  
  // 年度を変更
  changeFiscalYear(year) {
    if (this.currentFiscalYear === year) {
      return false; // 変更なし
    }
    
    // 現在のデータを保存
    this._saveCurrentYearData();
    
    // 年度を更新
    this.currentFiscalYear = year;
    
    // 新しい年度のデータをロード
    this._loadYearData(year);
    
    return true;
  }
  
  // 現在の年度データを保存
  _saveCurrentYearData() {
    // アクティブデータをストレージに保存
    this.activeMonthlyData.forEach((value, key) => {
      storageManager.setItem(key, value, this.currentFiscalYear);
    });
    
    console.log(`${this.currentFiscalYear}年度のデータを保存しました`);
  }
  
  // 指定年度のデータをロード
  _loadYearData(year) {
    // 既存のデータをクリア
    this.activeMonthlyData.clear();
    
    // 年度データをストレージから読み込み
    const yearData = storageManager.getAllItemsByYear(year);
    
    // データをアクティブマップに設定
    Object.entries(yearData).forEach(([key, value]) => {
      this.activeMonthlyData.set(key, value);
    });
    
    console.log(`${year}年度のデータをロードしました`);
    return Object.keys(yearData).length > 0;
  }
  
  // 月次データの保存
  saveMonthlyData(month, data) {
    const key = `month_${month}`;
    
    // アクティブデータを更新
    this.activeMonthlyData.set(key, data);
    
    // ストレージにも保存
    return storageManager.setItem(key, data, this.currentFiscalYear);
  }
  
  // 月次データの取得
  getMonthlyData(month) {
    const key = `month_${month}`;
    
    // まずアクティブデータから取得
    if (this.activeMonthlyData.has(key)) {
      return this.activeMonthlyData.get(key);
    }
    
    // ストレージから取得
    const data = storageManager.getItem(key, this.currentFiscalYear);
    
    // 見つかった場合はアクティブデータにもキャッシュ
    if (data) {
      this.activeMonthlyData.set(key, data);
    }
    
    return data;
  }
  
  // すべての月次データを取得
  getAllMonthlyData() {
    const result = {};
    
    // 1〜12月のデータを取得
    for (let month = 1; month <= 12; month++) {
      const data = this.getMonthlyData(month);
      if (data) {
        result[month] = data;
      }
    }
    
    return result;
  }
  
  // 年度データのクリア
  clearYearData(year) {
    const targetYear = year || this.currentFiscalYear;
    
    // 現在の年度の場合はアクティブデータもクリア
    if (targetYear === this.currentFiscalYear) {
      this.activeMonthlyData.clear();
    }
    
    // ストレージから年度データを削除
    return storageManager.clearYear(targetYear);
  }
}

export default new FiscalYearManager();