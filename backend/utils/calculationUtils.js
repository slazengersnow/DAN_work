// utils/calculationUtils.js

/**
 * 雇用率計算に関するユーティリティ関数
 */
const calculationUtils = {
  /**
   * 法定雇用率を計算する
   * @param {Object} data - 計算に必要なデータ
   * @param {number} data.employees_count - 従業員総数
   * @param {number} data.level1_2_count - 重度身体障がい者・重度知的障がい者の数
   * @param {number} data.other_disability_count - その他障がい者の数
   * @param {number} data.level1_2_parttime_count - 重度身体障がい者・重度知的障がい者（パートタイム）の数
   * @param {number} data.other_parttime_count - その他障がい者（パートタイム）の数
   * @returns {number} 計算された雇用率（%）
   */
  calculateLegalEmploymentRate: (data) => {
    // 障がい者のカウント（重度はダブルカウント、パートタイムは0.5カウント）
    const disabledCount = 
      (data.level1_2_count || 0) * 2 + 
      (data.other_disability_count || 0) + 
      (data.level1_2_parttime_count || 0) + 
      (data.other_parttime_count || 0) * 0.5;
    
    // 従業員総数
    const totalEmployees = data.employees_count || 0;
    
    // 雇用率計算（従業員数が0の場合は0を返す）
    if (totalEmployees === 0) {
      return 0;
    }
    
    // 雇用率を小数点第2位まで計算（%表示）
    return parseFloat(((disabledCount / totalEmployees) * 100).toFixed(2));
  },

  /**
   * 不足数を計算する
   * @param {Object} data - 計算に必要なデータ
   * @param {number} legalRate - 法定雇用率（%）
   * @returns {number} 不足数（負数の場合は余剰を表す）
   */
  calculateShortage: (data, legalRate) => {
    // 障がい者のカウント（重度はダブルカウント、パートタイムは0.5カウント）
    const disabledCount = 
      (data.level1_2_count || 0) * 2 + 
      (data.other_disability_count || 0) + 
      (data.level1_2_parttime_count || 0) + 
      (data.other_parttime_count || 0) * 0.5;
    
    // 従業員総数
    const totalEmployees = data.employees_count || 0;
    
    // 法定雇用障害者数の計算（小数点以下切り捨て）
    const legalEmploymentCount = Math.floor(totalEmployees * (legalRate / 100));
    
    // 不足数の計算（負数の場合は余剰を表す）
    return legalEmploymentCount - disabledCount;
  },
  
  /**
   * 納付金額を計算する
   * @param {number} shortageCount - 不足数
   * @param {number} paymentUnitAmount - 1人あたりの納付金額（月額）
   * @returns {number} 年間納付金額
   */
  calculatePaymentAmount: (shortageCount, paymentUnitAmount = 50000) => {
    // 不足人数が0以下の場合は納付金なし
    if (shortageCount <= 0) {
      return 0;
    }
    
    // 納付金額計算（1人あたり月額 x 12ヶ月）
    return shortageCount * paymentUnitAmount * 12;
  },
  
  /**
   * 月次データから年間平均値を計算する
   * @param {Array} monthlyData - 月次データの配列
   * @param {string} fieldName - 平均を計算するフィールド名
   * @returns {number} 年間平均値
   */
  calculateYearlyAverage: (monthlyData, fieldName) => {
    if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
      return 0;
    }
    
    // 指定フィールドの合計を計算
    const sum = monthlyData.reduce((total, month) => {
      const value = month[fieldName] || 0;
      return total + parseFloat(value);
    }, 0);
    
    // 平均値を計算
    return parseFloat((sum / monthlyData.length).toFixed(2));
  }
};

module.exports = calculationUtils;