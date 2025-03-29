// frontend/src/pages/EmployeeList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ImportEmployees from '../components/ImportEmployees';
import { Employee as ImportedEmployee } from '../types/Employee';

// モックデータ用のタイプ定義
interface Employee {
  id: number;
  employee_id: string;
  name: string;
  disability_type?: string;
  physical_verified?: boolean;
  intellectual_verified?: boolean;
  mental_verified?: boolean;
  physical_degree_current?: string;
  intellectual_degree_current?: string;
  mental_degree_current?: string;
  count: number;
  status: string;
}

// インポートされた社員データを現在のシステムの型に変換する関数
const convertImportedEmployees = (importedEmployees: ImportedEmployee[]): Employee[] => {
  return importedEmployees.map(imp => ({
    id: imp.id || 0,
    employee_id: imp.employeeId || '',
    name: imp.name || '',
    disability_type: imp.disabilityType as string || '',
    physical_verified: imp.disabilityType === '身体障害' || false,
    intellectual_verified: imp.disabilityType === '知的障害' || false,
    mental_verified: imp.disabilityType === '精神障害' || false,
    physical_degree_current: imp.physicalGrade,
    intellectual_degree_current: imp.grade,
    mental_degree_current: imp.grade,
    count: imp.count || 0,
    status: imp.status || '在籍中',
  }));
};

// モックAPI実装
const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    // 開発用のモックデータ
    return [
      { id: 1, employee_id: "1001", name: "山田 太郎", disability_type: "身体障害", physical_verified: true, physical_degree_current: "1級", count: 2, status: "在籍中" },
      { id: 2, employee_id: "1002", name: "鈴木 花子", disability_type: "精神障害", mental_verified: true, mental_degree_current: "2級", count: 1, status: "在籍中" },
      { id: 3, employee_id: "1003", name: "佐藤 一郎", disability_type: "知的障害", intellectual_verified: true, intellectual_degree_current: "B", count: 1, status: "在籍中" },
      { id: 4, employee_id: "1004", name: "田中 健太", disability_type: "身体障害", physical_verified: true, physical_degree_current: "3級", count: 0.5, status: "在籍中" },
      { id: 5, employee_id: "1005", name: "伊藤 由美", disability_type: "精神障害", mental_verified: true, mental_degree_current: "3級", count: 1, status: "在籍中" },
      { id: 6, employee_id: "1006", name: "渡辺 隆", disability_type: "身体障害", physical_verified: true, physical_degree_current: "2級", count: 1, status: "退職" },
      { id: 7, employee_id: "1007", name: "高橋 恵子", disability_type: "知的障害", intellectual_verified: true, intellectual_degree_current: "A", count: 1, status: "在籍中" },
    ];
  },
  delete: async (id: number): Promise<void> => {
    // モック削除処理
    console.log(`社員ID ${id} を削除しました`);
    return Promise.resolve();
  },
  importEmployees: async (employees: Employee[]): Promise<void> => {
    // モックインポート処理
    console.log(`${employees.length}人の社員データをインポートしました`, employees);
    return Promise.resolve();
  }
};

// CSVエクスポートのモック関数
const exportEmployeesToCsv = async (): Promise<void> => {
  console.log('CSVエクスポート処理（モック）');
  return Promise.resolve();
};

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();  // window.location.href の代わりに使用
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<string>('10');
  const [disabilityFilter, setDisabilityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showImportSection, setShowImportSection] = useState<boolean>(false);
  
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

  // インポートミューテーション
  const importMutation = useMutation(
    (employees: Employee[]) => employeeApi.importEmployees(employees),
    {
      onSuccess: () => {
        // 成功時にキャッシュを更新
        queryClient.invalidateQueries('employees');
        setShowImportSection(false);
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
  
  // 新規追加ハンドラー - React Routerのnavigateを使用
  const handleAddNew = () => {
    navigate('/employees/new');
  };
  
  // 詳細表示ハンドラー - React Routerのnavigateを使用
  const handleViewDetails = (id: number) => {
    navigate(`/employees/${id}`);
  };
  
  // 編集ハンドラー - React Routerのnavigateを使用
  const handleEdit = (id: number) => {
    navigate(`/employees/${id}/edit`);
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
      alert('CSVエクスポートが完了しました（モック処理）');
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      alert('CSVエクスポート中にエラーが発生しました');
    }
  };

  // CSVインポート完了ハンドラー
  const handleImportComplete = (importedEmployees: ImportedEmployee[]) => {
    try {
      // インポートされたデータを現在のシステムの型に変換
      const convertedEmployees = convertImportedEmployees(importedEmployees);
      // 変換されたデータをインポート
      importMutation.mutate(convertedEmployees);
    } catch (error) {
      console.error('インポートエラー:', error);
      alert('データのインポート中にエラーが発生しました');
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

      {/* インポートセクション切り替えボタン */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowImportSection(!showImportSection)}
          style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #ced4da',
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showImportSection ? 'インポート機能を閉じる' : 'CSVインポート機能を表示'}
        </button>
      </div>

      {/* インポート機能セクション */}
      {showImportSection && (
        <ImportEmployees onImportComplete={handleImportComplete} />
      )}
      
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