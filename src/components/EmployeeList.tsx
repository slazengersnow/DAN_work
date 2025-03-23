// src/components/EmployeeList.tsx
import React, { useState, ChangeEvent } from 'react';
import { employeesData } from '../data/mockData';
import { Employee, EmployeeListProps } from '../types/Employee';

const EmployeeList: React.FC<EmployeeListProps> = ({ onEmployeeSelect }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [disabilityFilter, setDisabilityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

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

  // 検索とフィルター適用後のデータ
  const filteredEmployees = employeesData.filter(employee => {
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
        </div>
      </div>
      
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
    </div>
  );
};

export default EmployeeList;