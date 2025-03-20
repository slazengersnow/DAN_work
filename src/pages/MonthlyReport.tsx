import React, { useState } from 'react';

// サマリータブコンポーネント
const Summary: React.FC = () => {
  return (
    <div className="summary-tab">
      <h3>障害者雇用者詳細</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>社員ID</th>
            <th>氏名</th>
            <th>障害区分</th>
            <th>障害</th>
            <th>等級</th>
            <th>採用日</th>
            <th>カウント</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>1001</td>
            <td>山田 太郎</td>
            <td>身体障害</td>
            <td>視覚</td>
            <td>1級</td>
            <td>2020/04/01</td>
            <td>2</td>
          </tr>
          <tr>
            <td>2</td>
            <td>2222</td>
            <td>鈴木 花子</td>
            <td>身体障害</td>
            <td>聴覚</td>
            <td>4級</td>
            <td>2020/04/01</td>
            <td>1</td>
          </tr>
          <tr>
            <td>3</td>
            <td>3333</td>
            <td>佐藤 一郎</td>
            <td>知的障害</td>
            <td>-</td>
            <td>B</td>
            <td>2020/04/01</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// 従業員詳細タブコンポーネント
const EmployeeDetail: React.FC = () => {
  return (
    <div className="employee-detail-tab">
      <h3>従業員詳細情報</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>社員ID</th>
            <th>氏名</th>
            <th>障害区分</th>
            <th>障害</th>
            <th>等級</th>
            <th>採用日</th>
            <th>在籍状況</th>
            <th>4月</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>1001</td>
            <td>山田 太郎</td>
            <td>身体障害</td>
            <td>視覚</td>
            <td>1級</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>2</td>
          </tr>
          <tr>
            <td>2</td>
            <td>2222</td>
            <td>鈴木 花子</td>
            <td>身体障害</td>
            <td>聴覚</td>
            <td>4級</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
          <tr>
            <td>3</td>
            <td>3333</td>
            <td>佐藤 一郎</td>
            <td>知的障害</td>
            <td>-</td>
            <td>B</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
          <tr>
            <td>4</td>
            <td>4444</td>
            <td>高橋 勇太</td>
            <td>精神障害</td>
            <td>ADHD</td>
            <td>3級</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
          <tr>
            <td>5</td>
            <td>5555</td>
            <td>田中 美咲</td>
            <td>精神障害</td>
            <td>うつ病</td>
            <td>2級</td>
            <td>2021/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// 月次詳細タブコンポーネント
const MonthlyDetail: React.FC = () => {
  return (
    <div className="monthly-detail-tab">
      <h3>月次詳細</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>年月</th>
            <th>常用労働者数</th>
            <th>障害者数</th>
            <th>雇用カウント</th>
            <th>実雇用率</th>
            <th>法定雇用率</th>
            <th>不足数</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024年4月</td>
            <td>525</td>
            <td>5</td>
            <td>12.75</td>
            <td>2.43%</td>
            <td>2.3%</td>
            <td>0</td>
          </tr>
          <tr>
            <td>2024年5月</td>
            <td>525</td>
            <td>5</td>
            <td>12.75</td>
            <td>2.43%</td>
            <td>2.3%</td>
            <td>0</td>
          </tr>
          <tr>
            <td>2024年6月</td>
            <td>530</td>
            <td>5</td>
            <td>12.75</td>
            <td>2.41%</td>
            <td>2.3%</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// メインの月次報告コンポーネント
const MonthlyReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [year, setYear] = useState<string>('2024年');
  const [month, setMonth] = useState<string>('11月');

  // タブの切り替え処理
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="page-content">
      <h1>月次報告</h1>
      
      {/* 期間選択部分 */}
      <div className="period-selector">
        <span>対象期間</span>
        <select 
          className="year-select" 
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="2024年">2024年</option>
          <option value="2023年">2023年</option>
        </select>
        <select 
          className="month-select"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={`${m}月`}>{m}月</option>
          ))}
        </select>
        <button className="display-button">表示</button>
      </div>
      
      {/* 2024年集計サマリー部分 - すべてのタブで表示 */}
      <div className="summary-box">
        <h2>2024年集計サマリー</h2>
        <p>常用労働者数: 525名 | 障害者数: 5名 | 雇用カウント: 12.75 | 実雇用率: 2.43% | 法定雇用率: 2.3%</p>
      </div>
      
      {/* タブナビゲーション */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'summary' ? 'active' : ''} 
          onClick={() => handleTabChange('summary')}
        >
          サマリー
        </button>
        <button 
          className={activeTab === 'employeeDetail' ? 'active' : ''} 
          onClick={() => handleTabChange('employeeDetail')}
        >
          従業員詳細
        </button>
        <button 
          className={activeTab === 'monthlyDetail' ? 'active' : ''} 
          onClick={() => handleTabChange('monthlyDetail')}
        >
          月次詳細
        </button>
      </div>
      
      {/* タブコンテンツ - アクティブなタブのみ表示 */}
      <div className="tab-content">
        {activeTab === 'summary' && <Summary />}
        {activeTab === 'employeeDetail' && <EmployeeDetail />}
        {activeTab === 'monthlyDetail' && <MonthlyDetail />}
      </div>
    </div>
  );
};

export default MonthlyReport;