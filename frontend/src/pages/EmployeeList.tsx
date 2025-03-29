// frontend/src/pages/EmployeeList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';

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
  selected?: boolean; // 選択状態を追加
}

// モックAPI実装（実際の環境では実際のAPIに置き換え）
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
  downloadTemplate: async (): Promise<void> => {
    try {
      // CSVテンプレートの内容
      const template = `社員ID,氏名,フリガナ,性別,障害種別,等級,手帳番号,発行日,カウント,ステータス
1001,山田 太郎,ヤマダ タロウ,1,身体障害,1級,A-12345,2020-04-01,2,在籍中
,,,,,,,,,
`;
      
      // CSVファイルを作成
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'employee_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('テンプレートをダウンロードしました');
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
      throw error;
    }
  },
  importCsv: async (file: File): Promise<void> => {
    // CSVインポートのモック処理
    console.log(`CSVファイル "${file.name}" をインポートしました（モック処理）`);
    return Promise.resolve();
  }
};

// Spinnerコンポーネント
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
    読み込み中...
  </div>
);

// ErrorMessageコンポーネント
const ErrorMessage = ({ message }: { message: string }) => (
  <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
    {message}
  </div>
);

// インポートモーダルコンポーネント
const ImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  // テンプレートダウンロード処理
  const handleDownloadTemplate = async () => {
    try {
      await employeeApi.downloadTemplate();
    } catch (error) {
      console.error('テンプレートダウンロードエラー:', error);
      alert('テンプレートのダウンロード中にエラーが発生しました');
    }
  };

  // CSVファイル選択処理
  const handleFileSelect = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await employeeApi.importCsv(file);
          alert('CSVインポートが完了しました（モック処理）');
          onSuccess();
          onClose();
        } catch (error) {
          console.error('CSVインポートエラー:', error);
          alert('CSVインポート中にエラーが発生しました');
        }
      }
    };
    
    fileInput.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '600px',
        maxWidth: '90%'
      }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>社員データのインポート</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button
            onClick={handleDownloadTemplate}
            style={{
              backgroundColor: '#4269f5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 16px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            インポートテンプレートをダウンロード
          </button>
          
          <button
            onClick={handleFileSelect}
            style={{
              backgroundColor: '#f8f9fa',
              color: '#212529',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '10px 16px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            CSVファイルを選択
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<string>('10');
  const [disabilityFilter, setDisabilityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<Record<number, boolean>>({});
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  
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
    navigate('/employees/new');
  };
  
  // 詳細表示ハンドラー
  const handleViewDetails = (id: number) => {
    // 詳細画面へ遷移
    navigate(`/employee-detail/${id}`);
    console.log(`社員ID: ${id} の詳細を表示します`);
  };
  
  // 編集ハンドラー
  const handleEdit = (id: number) => {
    // 編集画面へ遷移
    navigate(`/employee-edit/${id}`);
    console.log(`社員ID: ${id} を編集します`);
  };
  
  // CSVインポートモーダルを表示
  const handleShowImportModal = () => {
    setShowImportModal(true);
  };
  
  // インポート成功時の処理
  const handleImportSuccess = () => {
    queryClient.invalidateQueries('employees');
  };

  // 全選択/解除の処理
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAllSelected(isChecked);
    
    // 表示されている全社員の選択状態を更新
    const newSelectedEmployees = { ...selectedEmployees };
    displayedEmployees.forEach(employee => {
      newSelectedEmployees[employee.id] = isChecked;
    });
    
    setSelectedEmployees(newSelectedEmployees);
  };

  // 個別選択の処理
  const handleSelectEmployee = (id: number, checked: boolean) => {
    const newSelectedEmployees = { ...selectedEmployees, [id]: checked };
    setSelectedEmployees(newSelectedEmployees);
    
    // 全選択状態のチェック
    const allChecked = displayedEmployees.every(employee => newSelectedEmployees[employee.id]);
    setAllSelected(allChecked);
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error) {
    return <ErrorMessage message="社員データの読み込み中にエラーが発生しました" />;
  }

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>社員リスト</h1>
      
      {/* 検索・フィルターコントロール */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <input 
          type="text"
          placeholder="社員名または社員IDで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            width: '50%', 
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <select 
            value={disabilityFilter}
            onChange={(e) => setDisabilityFilter(e.target.value)}
            style={{ 
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="all">障害種別 ▼</option>
            <option value="physical">身体障害</option>
            <option value="intellectual">知的障害</option>
            <option value="mental">精神障害</option>
          </select>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ 
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="all">ステータス ▼</option>
            <option value="active">在籍中</option>
            <option value="inactive">退職</option>
          </select>
          
          <button 
            onClick={handleAddNew}
            style={{ 
              backgroundColor: '#4269f5', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            新規
          </button>
          
          <button
            onClick={handleShowImportModal}
            style={{ 
              backgroundColor: '#4caf50', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            CSVインポート
          </button>
        </div>
      </div>
      
      {/* 社員一覧テーブル */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
            <th style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }}>
              <input 
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#3a66d4' }}>社員ID</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#3a66d4' }}>氏名</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#3a66d4' }}>障害種別</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#3a66d4' }}>等級</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', color: '#3a66d4' }}>カウント</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#3a66d4' }}>ステータス</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', color: '#3a66d4' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {displayedEmployees.map(employee => (
            <tr key={employee.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  checked={!!selectedEmployees[employee.id]}
                  onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                />
              </td>
              <td style={{ padding: '12px 8px' }}>{employee.employee_id}</td>
              <td style={{ padding: '12px 8px' }}>{employee.name}</td>
              <td style={{ padding: '12px 8px' }}>{employee.disability_type || '-'}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>{getGradeDisplay(employee)}</td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>{employee.count}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  backgroundColor: employee.status === '在籍中' ? '#d4edda' : '#f8d7da',
                  color: employee.status === '在籍中' ? '#155724' : '#721c24'
                }}>
                  {employee.status}
                </span>
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => handleViewDetails(employee.id)}
                    style={{ 
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    詳細
                  </button>
                  <button 
                    onClick={() => handleEdit(employee.id)}
                    style={{ 
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    編集
                  </button>
                </div>
              </td>
            </tr>
          ))}
          
          {displayedEmployees.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
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
        </div>
      </div>
      
      {/* インポートモーダル */}
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
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