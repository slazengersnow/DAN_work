import React from 'react';
import { Spin, Empty } from 'antd';
import styles from '../MonthlyReport.module.css';

interface SummaryProps {
  loading: boolean;
  data: any;
  year: number;
  month: number;
}

const Summary: React.FC<SummaryProps> = ({ loading, data, year, month }) => {
  // 年度と月の選択フィールドは削除
  
  if (loading) {
    return <div className={styles.loadingContainer}><Spin size="large" /></div>;
  }
  
  if (!data) {
    return <Empty description="データがありません" />;
  }
  
  return (
    <div className={styles.summaryContainer}>
      <h3>{year}年{month}月 サマリー</h3>
      {/* サマリーコンテンツをここに表示 */}
      <div className={styles.summaryCard}>
        <div className={styles.cardItem}>
          <span className={styles.label}>従業員数</span>
          <span className={styles.value}>2名</span>
        </div>
        <div className={styles.cardItem}>
          <span className={styles.label}>障害者雇用率</span>
          <span className={styles.value}>2.3%</span>
        </div>
        {/* 他の統計情報 */}
      </div>
    </div>
  );
};

export default Summary;