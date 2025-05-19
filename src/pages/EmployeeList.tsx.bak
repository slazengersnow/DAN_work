import React, { useState } from 'react';

const EmployeeList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<string>('10');
  
  // 社員データ（サンプル）
  const employees = [
    { id: '1001', name: '山田 太郎', disabilityType: '身体障害', disabilityDetail: '視覚', grade: '1級', count: 2, status: '在籍中' },
    { id: '1002', name: '鈴木 花子', disabilityType: '身体障害', disabilityDetail: '肢体', grade: '2級', count: 1, status: '在籍中' },
    { id: '1003', name: '佐藤 一郎', disabilityType: '知的障害', disabilityDetail: 'B', grade: '', count: 1, status: '在籍中' },
    { id: '1004', name: '田中 隆太', disabilityType: '身体障害', disabilityDetail: '聴覚', grade: '3級', count: 0.5, status: '在籍中' },
    { id: '1005', name: '伊藤 由美', disabilityType: '精神障害', disabilityDetail: 'うつ病', grade: '3級', count: 1, status: '在籍中' },
    { id: '1006', name: '渡辺 隆', disabilityType: '身体障害', disabilityDetail: '肢体', grade: '2級', count: 1, status: '退職' },
    { id: '1007', name: '高橋 恵子', disabilityType: '知的障害', disabilityDetail: 'A', grade: '', count: 1, status: '在籍中' },
  ];
  
  // 検索フィルター
  const filteredEmployees = employees.filter(employee => 
    employee.name.includes(searchQuery) || 
    employee.id.includes(searchQuery)
  );

  return (
    <div className="page-container">
      <h1 className="page-title">社員リスト</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <input 
          type="text"
          placeholder="社員名または社員IDで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '300px' }}
        />
        
        <div>
          <select style={{ marginRight: '10px' }}>
            <option value="all">障害種別 ▼</option>
            <option value="physical">身体障害</option>
            <option value="intellectual">知的障害</option>
            <option value="mental">精神障害</option>
          </select>
          
          <select style={{ marginRight: '10px' }}>
            <option value="all">ステータス ▼</option>
            <option value="active">在籍中</option>
            <option value="inactive">退職</option>
          </select>
          
          <button>新規追加</button>
        </div>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>社員ID</th>
            <th>氏名</th>
            <th>障害種別</th>
            <th>障害</th>
            <th>等級</th>
            <th>カウント</th>
            <th>ステータス</th>
            <th>詳細</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.disabilityType}</td>
              <td>{employee.disabilityDetail}</td>
              <td>{employee.grade}</td>
              <td>{employee.count}</td>
              <td>
                <span className={`status-badge ${employee.status === '在籍中' ? 'status-active' : 'status-inactive'}`}>
                  {employee.status}
                </span>
              </td>
              <td>
                <button className="secondary">詳細</button>
              </td>
              <td>
                <button className="secondary">編集</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' }}>
        <div>全 {filteredEmployees.length} 件中 1-{Math.min(filteredEmployees.length, parseInt(displayCount))} 件を表示</div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>表示件数:</span>
          <select 
            value={displayCount}
            onChange={(e) => setDisplayCount(e.target.value)}
            style={{ marginRight: '10px' }}
          >
            <option value="10">10件</option>
            <option value="20">20件</option>
            <option value="50">50件</option>
          </select>
          <button style={{ marginLeft: '10px' }}>CSVエクスポート</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;