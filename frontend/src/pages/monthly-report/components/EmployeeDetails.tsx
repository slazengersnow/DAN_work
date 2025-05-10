import React from 'react';
import { Table, Tag, Spin, Empty } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import styles from '../MonthlyReport.module.css';

interface EmployeeDetailsProps {
  loading: boolean;
  data: any[];
  year: number;
  month: number;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ loading, data, year, month }) => {
  // 年度と月の選択フィールドは削除
  
  const columns = [
    { title: 'No.', dataIndex: 'index', key: 'index' },
    { title: '社員ID', dataIndex: 'id', key: 'id' },
    { title: '氏名', dataIndex: 'name', key: 'name' },
    { title: '障害区分', dataIndex: 'disabilityType', key: 'disabilityType' },
    { title: '障害', dataIndex: 'disability', key: 'disability' },
    { title: '等級', dataIndex: 'grade', key: 'grade' },
    { title: '採用日', dataIndex: 'employmentDate', key: 'employmentDate' },
    { 
      title: '状態', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '在籍' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    // 月ごとの列は動的に生成する実装も可能
    { title: '4月', dataIndex: 'april', key: 'april' },
    { title: '5月', dataIndex: 'may', key: 'may' },
    { title: '備考', dataIndex: 'remarks', key: 'remarks' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: any) => (
        <EditOutlined className={styles.editIcon} />
      )
    },
  ];
  
  if (loading) {
    return <div className={styles.loadingContainer}><Spin size="large" /></div>;
  }
  
  if (!data || data.length === 0) {
    return <Empty description="従業員データがありません" />;
  }
  
  // インデックスを追加したデータ
  const dataWithIndex = data.map((item, index) => ({
    ...item,
    index: index + 1,
    key: item.id,
  }));
  
  return (
    <div className={styles.employeeDetailsContainer}>
      <h3>{year}年{month}月 従業員詳細</h3>
      <Table 
        columns={columns} 
        dataSource={dataWithIndex} 
        pagination={false}
        className={styles.employeeTable}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default EmployeeDetails;