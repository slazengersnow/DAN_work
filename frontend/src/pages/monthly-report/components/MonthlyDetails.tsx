import React from 'react';
import { Spin, Empty, Card, Table } from 'antd';
import styles from '../MonthlyReport.module.css';

interface MonthlyDetailsProps {
  year: number;
  month: number;
  loading?: boolean;
  data?: any;
}

const MonthlyDetails: React.FC<MonthlyDetailsProps> = ({ loading = false, data, year, month }) => {
  if (loading) {
    return <div className={styles.loadingContainer}><Spin size="large" /></div>;
  }
  
  // サンプルデータを使用
  const monthlyData = {
    totalEmployees: 2,
    regularEmployees: 1,
    partTimeEmployees: 1,
    employmentRate: 2.3,
    legalRequirement: 2.5,
    monthlyReport: {
      status: '提出済み',
      submitDate: '2024-05-10',
      approver: '山田部長'
    }
  };
  
  // 月間報告書の状況データ
  const statusColumns = [
    { title: '項目', dataIndex: 'item', key: 'item' },
    { title: '状態', dataIndex: 'status', key: 'status' }
  ];
  
  const statusData = [
    { key: '1', item: '提出状況', status: monthlyData.monthlyReport.status },
    { key: '2', item: '提出日', status: monthlyData.monthlyReport.submitDate },
    { key: '3', item: '承認者', status: monthlyData.monthlyReport.approver },
  ];
  
  return (
    <div className={styles.monthlyDetailsContainer}>
      <h3>{year}年{month}月 月次詳細</h3>
      <Card className={styles.monthlyCard} title="月次報告書の状況">
        <Table 
          columns={statusColumns} 
          dataSource={statusData} 
          pagination={false}
          size="small"
          bordered
        />
      </Card>
      
      <Card className={styles.monthlyCard} title="月次集計データ" style={{ marginTop: '20px' }}>
        <div className={styles.summaryCard}>
          <div className={styles.cardItem}>
            <span className={styles.label}>法定雇用率</span>
            <span className={styles.value}>{monthlyData.legalRequirement}%</span>
          </div>
          <div className={styles.cardItem}>
            <span className={styles.label}>実雇用率</span>
            <span className={styles.value}>{monthlyData.employmentRate}%</span>
          </div>
          <div className={styles.cardItem}>
            <span className={styles.label}>対象障害者数</span>
            <span className={styles.value}>{monthlyData.totalEmployees}名</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MonthlyDetails;