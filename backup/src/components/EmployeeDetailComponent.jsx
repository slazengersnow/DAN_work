import React, { useState, useEffect } from 'react';

const EmployeeDetailComponent = () => {
  const [loading, setLoading] = useState(true);
  
  // モックデータ
  const mockEmployeeData = [
    {
      no: 1,
      employeeId: "1001",
      name: "山田 太郎",
      disabilityType: "身体障害",
      disability: "視覚",
      grade: "1級",
      hireDate: "2020/04/01",
      status: "在籍",
      monthlyData: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    },
    {
      no: 2,
      employeeId: "2222",
      name: "鈴木 花子",
      disabilityType: "身体障害",
      disability: "聴覚",
      grade: "4級",
      hireDate: "2020/04/01",
      status: "在籍",
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    },
    {
      no: 3,
      employeeId: "3333",
      name: "佐藤 一郎",
      disabilityType: "知的障害",
      disability: "-",
      grade: "B",
      hireDate: "2020/04/01",
      status: "在籍",
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    },
    {
      no: 4,
      employeeId: "4444",
      name: "高橋 勇太",
      disabilityType: "精神障害",
      disability: "ADHD",
      grade: "3級",
      hireDate: "2020/04/01",
      status: "在籍",
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    },
    {
      no: 5,
      employeeId: "5555",
      name: "田中 美咲",
      disabilityType: "精神障害",
      disability: "うつ病",
      grade: "2級",
      hireDate: "2021/04/01",
      status: "在籍",
      monthlyData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    }
  ];

  // データロード時の動作をシミュレート
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="card">
      <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>従業員詳細情報</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: '1500px' }}>
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
              <th>5月</th>
              <th>6月</th>
              <th>7月</th>
              <th>8月</th>
              <th>9月</th>
              <th>10月</th>
              <th>11月</th>
              <th>12月</th>
              <th>1月</th>
              <th>2月</th>
              <th>3月</th>
            </tr>
          </thead>
          <tbody>
            {mockEmployeeData.map((employee, index) => (
              <tr key={index}>
                <td>{employee.no}</td>
                <td>{employee.employeeId}</td>
                <td>{employee.name}</td>
                <td>{employee.disabilityType}</td>
                <td>{employee.disability}</td>
                <td>{employee.grade}</td>
                <td>{employee.hireDate}</td>
                <td>
                  <span className="status-indicator status-active">
                    {employee.status}
                  </span>
                </td>
                
                {/* 各月のデータ */}
                {employee.monthlyData.map((value, idx) => (
                  <td key={idx} className="text-center">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDetailComponent;