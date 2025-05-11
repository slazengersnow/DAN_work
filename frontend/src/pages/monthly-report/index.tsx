import React, { useState, useEffect } from 'react';
import { Tabs, Select, Button, message } from 'antd';
import Summary from './components/Summary';
import EmployeeDetails from './components/EmployeeDetails';
import MonthlyDetails from './components/MonthlyDetails';
import styles from './MonthlyReport.module.css';

const { TabPane } = Tabs;
const { Option } = Select;

// 現在の年を取得
const currentYear = new Date().getFullYear();
// 年の選択肢
const yearOptions = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

const MonthlyReport: React.FC = () => {
  // 状態の定義
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 現在の月
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // 年度か月が変更されたときのハンドラ
  const handleUpdate = () => {
    fetchReportData(year, month);
  };

  // レポートデータを取得する関数
  const fetchReportData = async (year: number, month: number) => {
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
      message.success(`${year}年${month}月のデータを読み込みました`);
    } catch (error) {
      console.error('データ取得エラー:', error);
      message.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時に初期データを取得
  useEffect(() => {
    fetchReportData(year, month);
  }, []);

  // タブ切替ハンドラ
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>月次報告</h1>
      
      {/* 年度と月の選択セクション - CSSで非表示にする */}
      <div className={`${styles.filterSection} ${styles.yearMonthDisplay}`}>
        <div className={styles.filterItem}>
          <label htmlFor="year-select">年度:</label>
          <Select
            id="year-select"
            value={year}
            onChange={value => setYear(value)}
            className={styles.select}
          >
            {yearOptions.map(y => (
              <Option key={y} value={y}>{y}</Option>
            ))}
          </Select>
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="month-select">月:</label>
          <Select
            id="month-select"
            value={month}
            onChange={value => setMonth(value)}
            className={styles.select}
          >
            {[...Array(12)].map((_, i) => (
              <Option key={i + 1} value={i + 1}>{i + 1}月</Option>
            ))}
          </Select>
        </div>
        
        <Button 
          type="primary" 
          onClick={handleUpdate} 
          loading={loading}
          className={styles.updateButton}
        >
          更新
        </Button>
      </div>
      
      {/* タブコンテナ - このセクションは表示する */}
      <div className={styles.tabsContainer} id="monthly-report-tabs">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="サマリー" key="1">
            <Summary 
              loading={loading} 
              data={reportData?.summary} 
              year={year}
              month={month}
            />
          </TabPane>
          <TabPane tab="従業員詳細" key="2">
            <EmployeeDetails 
              loading={loading} 
              data={reportData?.employees} 
              year={year}
              month={month}
            />
          </TabPane>
          <TabPane tab="月次詳細" key="3">
            <MonthlyDetails 
              loading={loading} 
              data={reportData?.monthlyData} 
              year={year}
              month={month}
            />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default MonthlyReport;