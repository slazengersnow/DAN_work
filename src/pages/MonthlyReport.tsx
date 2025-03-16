import React, { useState } from 'react';

// モックデータ
const mockSummary = {
  year: 2024,
  month: 11,
  totalEmployees: 525,
  disabledEmployees: 5,
  employmentCount: 12.75,
  actualRate: 2.43,
  legalRate: 2.3,
};

// 新しいモックデータ（画像2に基づく）
const mockDetailData = {
  employees: [
    { number: 1, id: 1001, name: '山田 太郎', type: '身体障害', grade: '1級', hireDate: '2020/04/01 00:00:00', status: '在籍', count: 2.0,
      monthly: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, // 1-12月の在籍状況
    { number: 2, id: 2222, name: '鈴木 花子', type: '身体障害', grade: '4級', hireDate: '2020/04/01 00:00:00', status: '在籍', count: 1.0,
      monthly: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { number: 3, id: 3333, name: '佐藤 一郎', type: '知的障害', grade: 'B', hireDate: '2020/04/01 00:00:00', status: '在籍', count: 1.0,
      monthly: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { number: 4, id: 4444, name: '高橋 勇太', type: '精神障害', grade: '3級', hireDate: '2020/04/01 00:00:00', status: '在籍', count: 1.0,
      monthly: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
    { number: 5, id: 5555, name: '田中 美咲', type: '精神障害', grade: '2級', hireDate: '2021/04/01 00:00:00', status: '在籍', count: 1.0,
      monthly: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
  ]
};

// 画像1に基づくもっと詳細なデータ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockMonthlyDetailData = [
  { month: 1, total: 645, mon: 600, tue: 604, wed: 633, thu: 640, fri: 650, sat: 0, sun: 0, 
    avg: 650, min: 600, max: 652 },
  { month: 2, total: 650, mon: 600, tue: 604, wed: 633, thu: 640, fri: 650, sat: 0, sun: 0,
    avg: 655, min: 600, max: 660 },
  { month: 3, total: 665, mon: 610, tue: 620, wed: 635, thu: 645, fri: 665, sat: 0, sun: 0,
    avg: 662, min: 610, max: 665 },
  // 残りの月も同様に...
];

const mockEmployees = [
  { no: 1, id: 1001, name: '山田 太郎', type: '身体障害', grade: '1級', hireDate: '2020/04/01', count: 2.0, status: '在籍', flag: 1, comment: '-' },
  { no: 2, id: 2222, name: '鈴木 花子', type: '身体障害', grade: '4級', hireDate: '2020/04/01', count: 1.0, status: '在籍', flag: 1, comment: '-' },
  { no: 3, id: 3333, name: '佐藤 一郎', type: '知的障害', grade: 'B', hireDate: '2020/04/01', count: 1.0, status: '在籍', flag: 1, comment: '-' },
  { no: 4, id: 4444, name: '高橋 勇太', type: '精神障害', grade: '3級', hireDate: '2020/04/01', count: 1.0, status: '在籍', flag: 1, comment: '-' },
  { no: 5, id: 5555, name: '田中 美咲', type: '精神障害', grade: '2級', hireDate: '2021/04/01', count: 1.0, status: '在籍', flag: 1, comment: '-' },
];

const mockHistory = [
  { yearMonth: '2024/11', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.75, actualRate: 2.43, status: '確定済' },
  { yearMonth: '2024/10', totalEmployees: 525, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.5, actualRate: 2.38, status: '確定済' },
  { yearMonth: '2024/09', totalEmployees: 520, disabledCount: 5, physical: 2, intellectual: 1, mental: 2, employmentCount: 12.0, actualRate: 2.31, status: '確定済' },
];

interface EmployeeDetailProps {
  number: number;
  id: number;
  name: string;
  type: string;
  grade: string;
  hireDate: string;
  status: string;
  count: number;
  monthly: number[];
}

const MonthlyReport: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [activeTab, setActiveTab] = useState<string>('summary');

  // 従業員の月次詳細データを表示する関数
  const renderEmployeeDetailTable = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    return (
      <div className="card" style={{ marginBottom: '20px', overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th>Unnamed:0</th>
              <th>Unnamed:1</th>
              <th>Unnamed:2</th>
              <th>Unnamed:3</th>
              <th>Unnamed:4</th>
              <th>Unnamed:5</th>
              <th>Unnamed:6</th>
              <th>在籍状況</th>
              {months.map((month, idx) => (
                <th key={idx}>{month}</th>
              ))}
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {mockDetailData.employees.map((employee: EmployeeDetailProps, idx: number) => (
              <tr key={idx}>
                <td>{employee.number}</td>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.type}</td>
                <td>{employee.grade}</td>
                <td>{employee.hireDate}</td>
                <td></td>
                <td>{employee.status}</td>
                {employee.monthly.map((value: number, monthIdx: number) => (
                  <td key={monthIdx}>{value}</td>
                ))}
                <td>-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 月次詳細データを表示する関数（画像1に基づく）
  const renderMonthlyDetailTable = () => {
    return (
      <div className="card" style={{ marginBottom: '20px', overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: '1500px' }}>
          <thead>
            <tr>
              <th>Unnamed:0</th>
              <th>Unnamed:1</th>
              <th>Unnamed:2</th>
              <th>Unnamed:3</th>
              <th>Unnamed:4</th>
              <th>Unnamed:5</th>
              <th>Unnamed:6</th>
              <th>Unnamed:7</th>
              <th>Unnamed:8</th>
              <th>Unnamed:9</th>
              <th>Unnamed:10</th>
              <th>Unnamed:11</th>
              <th>Unnamed:12</th>
              <th>Unnamed:13</th>
              <th>Unnamed:14</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>nan</td>
              <td>day</td>
              <td>week</td>
              <td>2023</td>
              <td>2023</td>
              <td>2023</td>
              <td>2023</td>
              <td>2023</td>
              <td>2023</td>
              <td>2023</td>
              <td>2024</td>
              <td>2024</td>
              <td>2024</td>
              <td>2024</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>month</td>
              <td>day</td>
              <td>4月</td>
              <td>5月</td>
              <td>6月</td>
              <td>7月</td>
              <td>8月</td>
              <td>9月</td>
              <td>10月</td>
              <td>11月</td>
              <td>12月</td>
              <td>1月</td>
              <td>2月</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>計算式</td>
              <td>600</td>
              <td>604</td>
              <td>633</td>
              <td>640</td>
              <td>650</td>
              <td>650</td>
              <td>660</td>
              <td>670</td>
              <td>665</td>
              <td>670</td>
              <td>690</td>
              <td>702</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>平均値</td>
              <td>650</td>
              <td>604</td>
              <td>633</td>
              <td>640</td>
              <td>650</td>
              <td>650</td>
              <td>660</td>
              <td>670</td>
              <td>665</td>
              <td>670</td>
              <td>690</td>
              <td>702</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>合計</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>法定雇用義務数</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>24</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>その他</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>33</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>障害者雇用率</td>
              <td>4</td>
              <td>4</td>
              <td>4</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>57</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>障害者雇用義務数</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>0.025</td>
              <td>nan</td>
              <td>nan</td>
            </tr>
            <tr>
              <td>nan</td>
              <td>月別合計</td>
              <td>11</td>
              <td>21.2</td>
              <td>21.2</td>
              <td>11</td>
              <td>11.25</td>
              <td>11.25</td>
              <td>11.5</td>
              <td>11.75</td>
              <td>11.825</td>
              <td>11.75</td>
              <td>12</td>
              <td>12.5</td>
              <td>nan</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h2 className="card-header">月次報告</h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <label>対象期間</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select 
              className="form-control" 
              style={{ width: '150px' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              <option value={2024}>2024年</option>
              <option value={2023}>2023年</option>
              <option value={2022}>2022年</option>
            </select>
            
            <select 
              className="form-control" 
              style={{ width: '150px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
          
          <button className="btn btn-primary">表示</button>
          <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>月次確定</button>
        </div>
      </div>
      
      <div className="card" style={{ backgroundColor: '#f0f8ff', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>2024年11月 集計サマリー</h3>
        <div style={{ fontSize: '14px' }}>
          常用労働者数: {mockSummary.totalEmployees}名 | 障害者数: {mockSummary.disabledEmployees}名 | 雇用カウント: {mockSummary.employmentCount} | 実雇用率: {mockSummary.actualRate}% | 法定雇用率: {mockSummary.legalRate}%
        </div>
      </div>

      {/* タブ切り替え */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        <div 
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'summary' ? '#f0f7ff' : 'transparent',
            borderBottom: activeTab === 'summary' ? '2px solid #4169e1' : 'none',
          }}
          onClick={() => setActiveTab('summary')}
        >
          サマリー
        </div>
        <div 
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'employees' ? '#f0f7ff' : 'transparent',
            borderBottom: activeTab === 'employees' ? '2px solid #4169e1' : 'none',
          }}
          onClick={() => setActiveTab('employees')}
        >
          従業員詳細
        </div>
        <div 
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'monthly' ? '#f0f7ff' : 'transparent',
            borderBottom: activeTab === 'monthly' ? '2px solid #4169e1' : 'none',
          }}
          onClick={() => setActiveTab('monthly')}
        >
          月次詳細
        </div>
      </div>
      
      {activeTab === 'summary' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>障害者雇用者詳細</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>社員ID</th>
                  <th>氏名</th>
                  <th>障害区分</th>
                  <th>等級</th>
                  <th>採用日</th>
                  <th>カウント</th>
                  <th>状態</th>
                  <th>11月フラグ</th>
                  <th>コメント</th>
                </tr>
              </thead>
              <tbody>
                {mockEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.no}</td>
                    <td>{employee.id}</td>
                    <td>{employee.name}</td>
                    <td>{employee.type}</td>
                    <td>{employee.grade}</td>
                    <td>{employee.hireDate}</td>
                    <td>{employee.count}</td>
                    <td>
                      <span className="status-indicator status-active">{employee.status}</span>
                    </td>
                    <td>{employee.flag}</td>
                    <td>{employee.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>月別実績履歴</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>年月</th>
                  <th>常用労働者数</th>
                  <th>障害者数</th>
                  <th>身体障害</th>
                  <th>知的障害</th>
                  <th>精神障害</th>
                  <th>雇用カウント</th>
                  <th>実雇用率</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((record, index) => (
                  <tr key={index}>
                    <td>{record.yearMonth}</td>
                    <td>{record.totalEmployees}</td>
                    <td>{record.disabledCount}</td>
                    <td>{record.physical}</td>
                    <td>{record.intellectual}</td>
                    <td>{record.mental}</td>
                    <td>{record.employmentCount}</td>
                    <td>{record.actualRate}%</td>
                    <td>
                      <span 
                        className="status-indicator status-active" 
                        style={{ backgroundColor: '#e6f7e6', color: '#28a745' }}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {activeTab === 'employees' && renderEmployeeDetailTable()}
      
      {activeTab === 'monthly' && renderMonthlyDetailTable()}
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button className="btn btn-secondary">印刷</button>
        <button className="btn btn-primary">CSVエクスポート</button>
      </div>
    </div>
  );
};

export default MonthlyReport;