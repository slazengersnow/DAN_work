import React, { useState } from 'react';
import EmployeeDetail from '../components/EmployeeDetail';

// モックデータ
const mockEmployees = [
  { 
    id: 1001, 
    name: '山田 太郎', 
    nameKana: 'ヤマダ タロウ',
    gender: '1', // 男性
    type: '身体障害', 
    physicalVerified: true,
    physicalVerification: 'A',
    physicalDegreeCurrent: '1級',
    physicalDegreePrevious: '',
    intellectualVerified: false,
    mentalVerified: false,
    grade: '1級', 
    count: 2.0, 
    status: '在籍中', 
    birthDate: '1980/05/15', 
    certificateNumber: 'A12345', 
    hireDate: '2020/04/01',
    expiryDate: '2025/05/14',
    workHours: 160, 
    actualHours: 160,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 155 + Math.floor(Math.random() * 10)
    }))
  },
  { 
    id: 1002, 
    name: '鈴木 花子', 
    nameKana: 'スズキ ハナコ',
    gender: '2', // 女性
    type: '精神障害', 
    physicalVerified: false,
    intellectualVerified: false,
    mentalVerified: true,
    mentalVerification: 'P',
    mentalDegreeCurrent: '2級',
    mentalDegreePrevious: '',
    grade: '2級', 
    count: 1.0, 
    status: '在籍中', 
    birthDate: '1985/10/20', 
    certificateNumber: 'P98765', 
    hireDate: '2020/04/01',
    expiryDate: '2025/10/19',
    workHours: 160, 
    actualHours: 150,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 145 + Math.floor(Math.random() * 10)
    }))
  },
  { 
    id: 1003, 
    name: '佐藤 一郎', 
    nameKana: 'サトウ イチロウ',
    gender: '1', // 男性
    type: '知的障害', 
    physicalVerified: false,
    intellectualVerified: true,
    intellectualVerification: 'D',
    intellectualDegreeCurrent: 'B',
    intellectualDegreePrevious: '',
    mentalVerified: false,
    grade: 'B', 
    count: 1.0, 
    status: '在籍中', 
    birthDate: '1990/03/18', 
    certificateNumber: 'B54321', 
    hireDate: '2021/10/01',
    expiryDate: '2026/03/17',
    workHours: 160, 
    actualHours: 155,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 155 + Math.floor(Math.random() * 10)
    }))
  },
  { 
    id: 1004, 
    name: '田中 健太', 
    nameKana: 'タナカ ケンタ',
    gender: '1', // 男性
    type: '身体障害', 
    physicalVerified: true,
    physicalVerification: 'A',
    physicalDegreeCurrent: '3級',
    physicalDegreePrevious: '',
    intellectualVerified: false,
    mentalVerified: false,
    grade: '3級', 
    count: 0.5, 
    status: '在籍中', 
    birthDate: '1978/12/05', 
    certificateNumber: 'A67890', 
    hireDate: '2019/07/01',
    expiryDate: '2024/12/04',
    workHours: 160, 
    actualHours: 160,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 160
    }))
  },
  { 
    id: 1005, 
    name: '伊藤 由美', 
    nameKana: 'イトウ ユミ',
    gender: '2', // 女性
    type: '精神障害', 
    physicalVerified: false,
    intellectualVerified: false,
    mentalVerified: true,
    mentalVerification: 'P',
    mentalDegreeCurrent: '3級',
    mentalDegreePrevious: '',
    grade: '3級', 
    count: 1.0, 
    status: '在籍中', 
    birthDate: '1992/06/23', 
    certificateNumber: 'P13579', 
    hireDate: '2022/01/15',
    expiryDate: '2027/06/22',
    workHours: 160, 
    actualHours: 145,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 145 + Math.floor(Math.random() * 10)
    }))
  },
  { 
    id: 1006, 
    name: '渡辺 隆', 
    nameKana: 'ワタナベ タカシ',
    gender: '1', // 男性
    type: '身体障害', 
    physicalVerified: true,
    physicalVerification: 'A',
    physicalDegreeCurrent: '2級',
    physicalDegreePrevious: '',
    intellectualVerified: false,
    mentalVerified: false,
    grade: '2級', 
    count: 1.0, 
    status: '退職', 
    birthDate: '1975/09/30', 
    certificateNumber: 'A24680', 
    hireDate: '2018/04/01',
    resignationDate: '2023/03/31',
    expiryDate: '2025/09/29',
    workHours: 160, 
    actualHours: 0,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 0,
      actualHours: 0
    }))
  },
  { 
    id: 1007, 
    name: '高橋 恵子', 
    nameKana: 'タカハシ ケイコ',
    gender: '2', // 女性
    type: '知的障害', 
    physicalVerified: false,
    intellectualVerified: true,
    intellectualVerification: 'D',
    intellectualDegreeCurrent: 'A',
    intellectualDegreePrevious: '',
    mentalVerified: false,
    grade: 'A', 
    count: 1.0, 
    status: '在籍中', 
    birthDate: '1988/11/11', 
    certificateNumber: 'B97531', 
    hireDate: '2021/04/01',
    expiryDate: '2026/11/10',
    workHours: 160, 
    actualHours: 160,
    monthlyData: Array(12).fill(0).map((_, idx) => ({
      month: `${idx < 9 ? idx + 4 : idx - 8}月`,
      scheduledHours: 160,
      actualHours: 160
    }))
  },
];

const EmployeeList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [isNewEmployee, setIsNewEmployee] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const handleEditClick = (employee: any) => {
    setSelectedEmployee(employee);
    setIsNewEmployee(false);
    setShowDetailModal(true);
  };

  const handleViewDetail = (employee: any) => {
    setSelectedEmployee(employee);
    setIsNewEmployee(false);
    setShowDetailModal(true);
  };

  const handleNewEmployee = () => {
    // 新規社員用の初期データ
    const newEmployeeData = {
      id: Math.max(...mockEmployees.map(e => e.id)) + 1,
      name: '',
      nameKana: '',
      gender: '1',
      type: '身体障害',
      physicalVerified: true,
      physicalVerification: 'A',
      physicalDegreeCurrent: '1級',
      intellectualVerified: false,
      mentalVerified: false,
      grade: '1級',
      count: 1.0,
      status: '在籍中',
      birthDate: '',
      certificateNumber: '',
      hireDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      monthlyData: Array(12).fill(0).map((_, idx) => ({
        month: `${idx < 9 ? idx + 4 : idx - 8}月`,
        scheduledHours: 160,
        actualHours: 160
      }))
    };
    
    setSelectedEmployee(newEmployeeData);
    setIsNewEmployee(true);
    setShowDetailModal(true);
  };

  const handleSaveEmployee = (employee: any) => {
    // 実際のアプリでは、ここでAPIを呼び出してデータを保存する
    console.log('保存されたデータ:', employee);
    setShowDetailModal(false);
  };

  const handleCancelDetail = () => {
    setShowDetailModal(false);
  };

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      employee.id.toString().includes(searchTerm);
    
    const matchesType = selectedFilter === '' || employee.type === selectedFilter;
    const matchesStatus = selectedStatus === '' || employee.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // ページネーション
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  return (
    <div>
      <h2 className="card-header">社員リスト</h2>
      
      <div className="card">
        {/* 検索・フィルター機能 - 高さを調整 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '15px',
          alignItems: 'center',
          height: '40px' // 高さを固定
        }}>
          <input
            type="text"
            className="form-control"
            placeholder="社員名または社員IDで検索..."
            style={{ width: '300px', height: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div style={{ display: 'flex', gap: '10px', height: '100%' }}>
            <select 
              className="form-control"
              style={{ height: '100%' }}
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="">障害種別 ▼</option>
              <option value="身体障害">身体障害</option>
              <option value="知的障害">知的障害</option>
              <option value="精神障害">精神障害</option>
            </select>
            
            <select 
              className="form-control"
              style={{ height: '100%' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">ステータス ▼</option>
              <option value="在籍中">在籍中</option>
              <option value="退職">退職</option>
            </select>
            
            <button 
              className="btn btn-primary" 
              style={{ height: '100%' }}
              onClick={handleNewEmployee}
            >
              新規追加
            </button>
          </div>
        </div>
        
        {/* テーブル */}
        <table className="table">
          <thead>
            <tr>
              <th>社員ID</th>
              <th>氏名</th>
              <th>障害種別</th>
              <th>等級</th>
              <th>カウント</th>
              <th>ステータス</th>
              <th>詳細</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.type}</td>
                <td>{employee.grade}</td>
                <td>{employee.count}</td>
                <td>
                  <span 
                    className={`status-indicator ${employee.status === '在籍中' ? 'status-active' : 'status-inactive'}`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-info btn-sm" 
                    onClick={() => handleViewDetail(employee)}
                  >
                    詳細
                  </button>
                </td>
                <td>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleEditClick(employee)}
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* ページネーションと表示件数選択 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div>
            全 {filteredEmployees.length} 件中 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredEmployees.length)} 件を表示
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>
              <label style={{ marginRight: '5px' }}>表示件数:</label>
              <select 
                className="form-control" 
                style={{ width: '80px', display: 'inline-block' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // ページサイズ変更時は1ページ目に戻る
                }}
              >
                <option value={10}>10件</option>
                <option value={30}>30件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
              </select>
            </div>
            
            <div>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'} btn-sm`} 
                  style={{ marginRight: '5px' }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
          
          <button className="btn btn-primary">CSVエクスポート</button>
        </div>
      </div>
      
      {/* 詳細モーダル */}
      {showDetailModal && selectedEmployee && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '5px', 
            width: '90%', 
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <EmployeeDetail 
              employee={selectedEmployee}
              onSave={handleSaveEmployee}
              onCancel={handleCancelDetail}
              isNew={isNewEmployee}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;