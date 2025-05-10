import React, { useState, useEffect } from 'react';
import { Tabs, message } from 'antd';
import Summary from './components/Summary';
import EmployeeDetails from './components/EmployeeDetails';
import MonthlyDetails from './components/MonthlyDetails';
import styles from './MonthlyReport.module.css';

const { TabPane } = Tabs;

const MonthlyReport: React.FC = () => {
  // 状態の定義
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // データ取得関数
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // APIからデータ取得のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // ダミーデータ
      const data = {
        summary: { /* サマリーデータ */ },
        employees: [
          { id: 1111, name: '伊藤 健一', disabilityType: '精神障害', grade: '3級', employmentDate: '2025/05/04', status: '在籍' },
          { id: 2222, name: '今井 智', disabilityType: '精神障害', grade: '3級', employmentDate: '2025/05/04', status: '在籍' }
        ],
        monthlyData: { /* 月次データ */ }
      };
      
      setReportData(data);
    } catch (error) {
      console.error('データ取得エラー:', error);
      message.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時に初期データを取得
  useEffect(() => {
    fetchReportData();
  }, []);

  // タブ切替ハンドラ
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 現在の年月（固定値または実際の日付から取得）
  const currentYear = 2025;
  const currentMonth = 5;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>月次報告</h1>
      
      {/* 年度/月の選択部分を完全に削除 */}
      
      {/* タブコンテンツ */}
      <div className={styles.tabsContainer}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="サマリー" key="1">
            <Summary 
              loading={loading} 
              data={reportData?.summary}
              year={currentYear}
              month={currentMonth}
            />
          </TabPane>
          <TabPane tab="従業員詳細" key="2">
            <EmployeeDetails 
              loading={loading} 
              data={reportData?.employees}
              year={currentYear}
              month={currentMonth}
            />
          </TabPane>
          <TabPane tab="月次詳細" key="3">
            <MonthlyDetails 
              loading={loading} 
              data={reportData?.monthlyData}
              year={currentYear}
              month={currentMonth}
            />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default MonthlyReport;