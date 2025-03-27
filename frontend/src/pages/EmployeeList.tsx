// frontend/src/pages/EmployeeList.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi, Employee, exportEmployeesToCsv } from '../api/employeeApi';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

const EmployeeList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<string>('10');
  const [disabilityFilter, setDisabilityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // React Queryを使ってデータを取得
  const { 
    data: employees = [], 
    isLoading, 
    error 
  } = useQuery(
    'employees',
    employeeApi.getAll,
    {
      staleTime: 60000, // 1分間はキャッシュを新鮮として扱う
      refetchOnWindowFocus: false
    }
  );
  
  // 削除ミューテーション
  const deleteMutation = useMutation(
    (id: number) => employeeApi.delete(id),
    {
      onSuccess: () => {
        // 成功時にキャッシュを更新
        queryClient.invalidateQueries('employees');
      }
    }
  );
  
  // 検索フィルター
  const filteredEmployees = employees.filter(employee => {
    // 検索クエリによるフィルタリング
    const matchesSearch = 
      (employee.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (employee.employee_id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // 障害種別によるフィルタリング
    const matchesDisability = 
      disabilityFilter === 'all' || 
      (employee.disability_type?.includes(disabilityFilter === 'physical' ? '身体' : 
                                         disabilityFilter === 'intellectual' ? '知的' : 
                                         disabilityFilter === 'mental' ? '精神' : '') || false);
    
    // ステータスによるフィルタリング
    const matchesStatus = 
      statusFilter === 'all' || 
      (employee.status === (statusFilter === 'active' ? '在籍中' : '退職'));
      
    return matchesSearch && matchesDisability && matchesStatus;
  });
  
  // 表示するデータを制限
  const displayLimit = parseInt(displayCount);
  const displayedEmployees = filteredEmployees.slice(0, displayLimit);
  
  // 新規追加ハンドラー
  const handleAddNew = () => {
    // 新規追加ページへ遷移
    window.location.href = '/employees/new';
  };
  
  // 詳細表示ハンドラー
  const handleViewDetails = (id: number) => {
    window.location.href = `/employees/${id}`;
  };
  
  // 編集ハンドラー
  const handleEdit = (id: number) => {
    window.location.href = `/employees/${id}/edit`;
  };
  
  // 削除ハンドラー
  const handleDelete = (id: number) => {
    if (window.confirm('本当にこの社員を削除しますか？')) {
      deleteMutation.mutate(id);
    }
  };
  
  // CSVエクスポートハンドラー
  const handleExportCsv = async () => {
    try {
      await exportEmployeesToCsv();
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      alert('CSVエクスポート中にエラーが発生しました');
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error) {
    return <ErrorMessage message="社員データの読み込み中にエラーが発生しました" />;
  }

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
          <select 
            style={{ marginRight: '10px' }}
            value={disabilityFilter}
            onChange={(e) => setDisabilityFilter(e.target.value)}
          >
            <option value="all">障害種別 ▼</option>
            <option value="physical">身体障害</option>
            <option value="intellectual">知的障害</option>
            <option value="mental">精神障害</option>
          </select>
          
          <select 
            style={{ marginRight: '10px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ステータス ▼</option>
            <option value="active">在籍中</option>
            <option value="inactive">退職</option>
          </select>
          
          <button onClick={handleAddNew}>新規追加</button>
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
          {displayedEmployees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.employee_id}</td>
              <td>{employee.name}</td>
              <td>{employee.disability_type || '-'}</td>
              <td>{getDisabilityDetail(employee)}</td>
              <td>{getGradeDisplay(employee)}</td>
              <td>{employee.count}</td>
              <td>
                <span className={`status-badge ${employee.status === '在籍中' ? 'status-active' : 'status-inactive'}`}>
                  {employee.status}
                </span>
              </td>
              <td>
                <button 
                  className="secondary"
                  onClick={() => handleViewDetails(employee.id)}
                >
                  詳細
                </button>
              </td>
              <td>
                <button 
                  className="secondary" 
                  onClick={() => handleEdit(employee.id)}
                  style={{ marginRight: '5px' }}
                >
                  編集
                </button>
                <button 
                  className="danger"
                  onClick={() => handleDelete(employee.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
          
          {displayedEmployees.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                社員情報が見つかりません
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' }}>
        <div>
          全 {filteredEmployees.length} 件中 
          {filteredEmployees.length > 0 ? ` 1-${Math.min(filteredEmployees.length, displayLimit)}` : ' 0'} 件を表示
        </div>
        
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
          
          <button 
            className="btn btn-primary" 
            onClick={handleExportCsv}
            disabled={filteredEmployees.length === 0}
          >
            CSVエクスポート
          </button>
        </div>
      </div>
    </div>
  );
};

// 障害詳細情報を取得するヘルパー関数
function getDisabilityDetail(employee: Employee): string {
  if (employee.physical_verified) {
    return '視覚・聴覚・肢体不自由など';
  } else if (employee.intellectual_verified) {
    return '知的障害';
  } else if (employee.mental_verified) {
    return '精神障害';
  }
  return '-';
}

// 等級表示を取得するヘルパー関数
function getGradeDisplay(employee: Employee): string {
  if (employee.physical_verified && employee.physical_degree_current) {
    return employee.physical_degree_current;
  } else if (employee.intellectual_verified && employee.intellectual_degree_current) {
    return employee.intellectual_degree_current;
  } else if (employee.mental_verified && employee.mental_degree_current) {
    return employee.mental_degree_current;
  }
  return '-';
}

export default EmployeeList;