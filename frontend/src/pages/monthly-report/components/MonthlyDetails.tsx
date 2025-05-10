import React from 'react';
import { Spin, Empty, Card } from 'antd';
import styles from '../MonthlyReport.module.css';

interface MonthlyDetailsProps {
  loading: boolean;
  data: any;
  year: number;
  month: number;
}

const MonthlyDetails: React.FC<MonthlyDetailsProps> = ({ loading, data, year, month }) => {
  // 年度と月の選択フィールドは削除
  
  if (loading) {
    return <div className={styles.loadingContainer}><Spin size="large" /></div>;
  }
  
  if (!data) {
    return <Empty description="月次データがありません" />;
  }
  
  return (
    <div className={styles.monthlyDetailsContainer}>
      <h3>{year}年{month}月 月次詳細</h3>
      <Card className={styles.monthlyCard}>
        {/* 月次詳細データの表示 */}
        <p>月次詳細データをここに表示します</p>
      </Card>
    </div>
  );
};

export default MonthlyDetails;