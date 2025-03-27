// src/components/EmployeeList.tsx
import React, { useState, ChangeEvent } from 'react';
// Employee型を明示的に参照するようにする
import type { Employee } from '../types/Employee';
// モックデータをインポート
import { employeesData } from '../data/mockData';
// インポートコンポーネントを追加
import ImportEmployees from './ImportEmployees';

interface EmployeeListProps {
  employees?: Employee[]; // オプショナルに変更
  onEmployeeSelect: (employee: Employee) => void;
  onEmployeesUpdate?: (updatedEmployees: Employee[]) => void; // 新規追加：社員データ更新通知用
}

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees: initialEmployees = employeesData, // デフォルト値としてモックデータを設定
  onEmployeeSelect,
  onEmployeesUpdate
}) => {
  // ローカルステートとして社員データを管理
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [disabilityFilter, setDisabilityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false); // インポート画面表示フラグ

  // 検索クエリハンドラ
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  // 障害種別フィルターハンドラ
  const handleDisabilityFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setDisabilityFilter(e.target.value);
  };

  // ステータスフィルターハンドラ
  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };
  
  // インポートボタンクリックハンドラ
  const handleImportClick = (): void => {
    setShowImport(!showImport);
  };
  
  // インポート完了ハンドラ
  const handleImportComplete = (importedEmployees: Employee[]): void => {
    // 社員データを更新（ここでは追加だけ、実際にはIDの重複チェックなども必要）
    const updatedEmployees = [...employees, ...importedEmployees];
    setEmployees(updatedEmployees);
    
    // 親コンポーネントに通知（存在する場合）
    if (onEmployeesUpdate) {
      onEmployeesUpdate(updatedEmployees);
    }
  };

  // 検索とフィルター適用後のデータ
  const filteredEmployees = employees.filter(employee => {
    // 検索クエリでフィルタリング
    const matchesSearch = searchQuery === '' || 
      employee.name.includes(searchQuery) || 
      employee.employeeId.includes(searchQuery);
    
    // 障害種別でフィルタリング
    const matchesDisability = disabilityFilter === '' || 
      employee.disabilityType === disabilityFilter;
    
    // ステータスでフィルタリング
    const matchesStatus = statusFilter === '' || 
      employee.status === statusFilter;
    
    return matchesSearch && matchesDisability && matchesStatus;
  });

  return (
    <div className="employee-list-container">
      <h2 className="section-title">社員リスト</h2>
      
      <div className="filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="社員名または社員IDで検索..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-selects">
          <select 
            value={disabilityFilter} 
            onChange={handleDisabilityFilterChange}
            className="filter-select"
          >
            <option value="">障害種別 ▼</option>
            <option value="身体障害">身体障害</option>
            <option value="精神障害">精神障害</option>
            <option value="知的障害">知的障害</option>
          </select>
          
          <select 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
            className="filter-select"
          >
            <option value="">ステータス ▼</option>
            <option value="在籍中">在籍中</option>
            <option value="退職">退職</option>
          </select>
          
          <button className="add-btn">新規</button>
          <button 
            onClick={handleImportClick} 
            className="import-btn"
          >
            {showImport ? 'インポート閉じる' : 'CSVインポート'}
          </button>
        </div>
      </div>
      
      {/* CSVインポート機能 */}
      {showImport && (
        <ImportEmployees onImportComplete={handleImportComplete} />
      )}
      
      <div className="table-container">
        <table className="employees-table">
          <thead>
            <tr>
              <th>社員ID</th>
              <th>氏名</th>
              <th>障害種別</th>
              <th>等級</th>
              <th>カウント</th>
              <th>ステータス</th>
              <th>詳細</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.employeeId}>
                <td>{employee.employeeId}</td>
                <td>{employee.name}</td>
                <td>{employee.disabilityType}</td>
                <td>{employee.grade}</td>
                <td>{employee.count}</td>
                <td>
                  <span className={`status-badge ${employee.status === '在籍中' ? 'active' : 'inactive'}`}>
                    {employee.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="detail-btn"
                    onClick={() => onEmployeeSelect(employee)}
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <style>
        {`
        .employee-list-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .section-title {
          font-size: 20px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .filters {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-container {
          flex: 1;
          min-width: 200px;
          margin-right: 20px;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .filter-selects {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 120px;
        }

        .add-btn, .import-btn {
          padding: 8px 15px;
          border: none;
          border-radius: 4px;
          background-color: #4285f4;
          color: white;
          cursor: pointer;
        }

        .import-btn {
          background-color: #34a853;
        }

        .table-container {
          overflow-x: auto;
        }

        .employees-table {
          width: 100%;
          border-collapse: collapse;
        }

        .employees-table th, .employees-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .employees-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
        }

        .status-badge.active {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background-color: #f8d7da;
          color: #721c24;
        }

        .detail-btn {
          padding: 5px 10px;
          background-color: #f1f3f4;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        `}
      </style>
    </div>
  );
};

export default EmployeeList;