import React from 'react';
import { Spin, Empty } from 'antd';
import styles from '../MonthlyReport.module.css';

interface SummaryProps {
  year: number;
  month: number;
  loading?: boolean;
  data?: any;
}

const Summary: React.FC<SummaryProps> = ({ loading = false, data, year, month }) => {
  if (loading) {
    return <div className={styles.loadingContainer}><Spin size="large" /></div>;
  }
  
  // サンプルデータを使用
  const summaryData = data || {
    employeeCount: 2,
    employmentRate: 2.3,
    regularCount: 1,
    partTimeCount: 1
  };
  
  return (
    <div className={styles.summaryContainer}>
      <h3>{year}年{month}月 サマリー</h3>
      <div className={styles.summaryCard}>
        <div className={styles.cardItem}>
          <span className={styles.label}>従業員数</span>
          <span className={styles.value}>{summaryData.employeeCount}名</span>
        </div>
        <div className={styles.cardItem}>
          <span className={styles.label}>障害者雇用率</span>
          <span className={styles.value}>{summaryData.employmentRate}%</span>
        </div>
        <div className={styles.cardItem}>
          <span className={styles.label}>常勤労働者</span>
          <span className={styles.value}>{summaryData.regularCount}名</span>
        </div>
        <div className={styles.cardItem}>
          <span className={styles.label}>短時間労働者</span>
          <span className={styles.value}>{summaryData.partTimeCount}名</span>
        </div>
      </div>
    </div>
  );
};

export default Summary;