import React, { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Button, Tooltip, message, Modal, Form, Input, Select, DatePicker } from 'antd';
import { EditOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../MonthlyReport.module.css';

// 従業員データの型定義
interface Employee {
  employeeId: number;
  name: string;
  disabilityType: string;
  disability?: string;
  grade: string;
  employmentDate: string; // YYYY/MM/DD 形式
  status: string;
  employmentType: string; // 雇用形態 (正社員, 短時間労働者, etc.)
  retirementDate?: string; // 退職日 (YYYY/MM/DD 形式)
  remarks?: string;
  // 月次HC値の配列 (4月〜3月の12ヶ月分)
  monthlyHC: (number | string)[]; 
}

interface EmployeesTabProps {
  loading: boolean;
  data: Employee[] | null;
  year: number;
  month: number;
  onDataChange?: (updatedData: Employee[]) => void;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({ 
  loading, 
  data, 
  year, 
  month,
  onDataChange 
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // 従業員データが変更されたときに状態を更新
  useEffect(() => {
    if (data) {
      const processedData = data.map(employee => {
        // 月次HC値を自動計算（毎月1日時点での在籍状況に基づく）
        return calculateMonthlyHC(employee);
      });
      setEmployees(processedData);
    }
  }, [data, year]);
  
  // 編集モードの切り替え
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  // 従業員編集モーダルを開く
  const openEditModal = (employee: Employee) => {
    setEditingEmployee({...employee});
    setIsModalVisible(true);
  };
  
  // 従業員編集モーダルを閉じる
  const closeEditModal = () => {
    setEditingEmployee(null);
    setIsModalVisible(false);
  };
  
  // 従業員データの保存
  const saveEmployeeData = (updatedEmployee: Employee) => {
    // 月次HC値を再計算
    const recalculatedEmployee = calculateMonthlyHC(updatedEmployee);
    
    // 従業員リストを更新
    const updatedEmployees = employees.map(emp => 
      emp.employeeId === recalculatedEmployee.employeeId ? recalculatedEmployee : emp
    );
    
    setEmployees(updatedEmployees);
    
    // 親コンポーネントに変更を通知
    if (onDataChange) {
      onDataChange(updatedEmployees);
    }
    
    message.success('従業員データを更新しました');
    closeEditModal();
  };
  
  // 月次HC値の自動計算 - 毎月1日時点での在籍状況に基づく
  const calculateMonthlyHC = (employee: Employee): Employee => {
    console.log(`===== HC自動計算関数開始 - ID=${employee.employeeId} =====`);
    console.log(`【HC自動計算】入力データ:`, employee);
    
    // 従業員データのコピーを作成
    const result = { ...employee };
    
    // 月次HC値の配列がない場合は初期化
    if (!result.monthlyHC || !Array.isArray(result.monthlyHC)) {
      result.monthlyHC = Array(12).fill('');
    }
    
    // 採用日をDate型に変換
    const employmentDate = new Date(employee.employmentDate);
    
    // 退職日がある場合はDate型に変換
    let retirementDate: Date | null = null;
    if (employee.retirementDate) {
      console.log(`【退職処理】退職日が設定されています: ${employee.retirementDate}`);
      retirementDate = new Date(employee.retirementDate);
    }
    
    // 現在の日付（表示用固定値として2025年5月を使用）
    const currentDate = new Date(2025, 4, 1); // 5月は0-indexed（4）
    
    console.log(`【HC自動計算】基本情報: 採用日=${employee.employmentDate}, 表示年度(過去年度)=${year}/${month}, 現在日付(固定)=2025/5, 退職日=${employee.retirementDate || '未設定'}`);
    
    // 各月について処理
    for (let m = 0; m < 12; m++) {
      // 対象月のインデックス（0: 4月, 11: 3月）
      const monthIndex = m;
      
      // 処理対象年月日（各月の1日）を生成
      const targetMonth = m < 9 ? m + 4 : m - 8; // 4月(0)→4月(4), 3月(11)→3月(3)
      const targetYear = m < 9 ? year : year + 1; // 4月〜12月は選択年、1月〜3月は選択年+1
      
      // 各月の1日を基準日として設定（毎月1日00:00時点での在籍状況）
      const targetDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0);
      
      // 日付の比較のためのログ出力
      console.log(`【日付比較】検証: 暦年${targetYear}月${targetMonth} vs 現在2025月5`);
      console.log(`【日付比較】現在日付(固定値): 2025年5月 (※要件に合わせて2025/5を使用)`);
      console.log(`【日付比較】表示中の年度: ${year}年度`);
      
      // 過去年度を表示する場合、全ての月を表示する判定
      const shouldDisplayMonth = year < currentDate.getFullYear() || 
        (year === currentDate.getFullYear() && targetMonth <= currentDate.getMonth() + 1);
      
      if (shouldDisplayMonth) {
        console.log(`【判定】過去年度(${year}年)の表示: ${targetYear}/${targetMonth}月 → すべて表示する`);
      } else {
        console.log(`【判定】未来年度または未来月: ${targetYear}/${targetMonth}月 → 表示しない`);
      }
      
      // 退職者の場合、退職月以前のみ計算
      let isBeforeRetirement = true;
      if (retirementDate) {
        // 退職日の月初日（当該月の1日）
        const retirementMonthStart = new Date(
          retirementDate.getFullYear(),
          retirementDate.getMonth(),
          1
        );
        
        // 対象月が退職月以前かチェック（退職月の1日以前ならカウント対象）
        isBeforeRetirement = targetDate <= retirementMonthStart;
        console.log(`【退職月判定】${targetMonth}月: 退職月(${retirementDate.getFullYear()}/${retirementDate.getMonth() + 1})以前=${isBeforeRetirement}`);
      }
      
      // 月次処理ログ
      console.log(`【月次処理】[${monthIndex + 1}]=${targetMonth}月: 暦年=${targetYear}, 採用日以降=${targetDate >= employmentDate}, 表示対象=${shouldDisplayMonth}`);
      
      // 計算ロジック
      if (shouldDisplayMonth) {
        // *** 重要: 毎月1日時点での在籍状況に基づく計算 ***
        if (targetDate >= employmentDate) {
          // 対象月の1日が採用日以降であるかチェック
          if (employee.status === '在籍' && isBeforeRetirement) {
            // HC値を雇用形態に基づいて設定
            const hcValue = employee.employmentType === '短時間労働者' ? 0.5 : 1;
            result.monthlyHC[monthIndex] = hcValue;
            console.log(`  → 在籍: ${targetMonth}月にHC値${hcValue}を設定`);
          } else if (employee.status === '退職' && isBeforeRetirement) {
            // 退職者で退職月以前
            const hcValue = employee.employmentType === '短時間労働者' ? 0.5 : 1;
            result.monthlyHC[monthIndex] = hcValue;
            console.log(`  → 退職: ${targetMonth}月にHC値${hcValue}を設定 (${targetYear}年${targetMonth}月)`);
          } else if (employee.status === '休職') {
            // 休職者
            result.monthlyHC[monthIndex] = result.monthlyHC[monthIndex] || 1; // 既存の値を保持
            console.log(`  → その他の状態: 休職 - 変更なし`);
          } else {
            // その他の状態（退職月より後など）
            result.monthlyHC[monthIndex] = '';
            console.log(`  → その他の状態: 空白`);
          }
        } else {
          // 採用日より前の月は空白
          if (employee.status === '在籍') {
            console.log(`  → 在籍: ${targetMonth}月は採用日前のため空白`);
          } else if (employee.status === '退職') {
            console.log(`  → 退職: ${targetMonth}月は採用日前のため空白`);
          } else {
            console.log(`  → その他: ${targetMonth}月は採用日前のため空白`);
          }
          result.monthlyHC[monthIndex] = '';
        }
      } else {
        // 未来の月は何も表示しない
        result.monthlyHC[monthIndex] = '';
        console.log(`  → 未来月のため空白`);
      }
    }
    
    console.log(`ID=${employee.employeeId}の月次ステータスを自動計算しました:`, result.monthlyHC);
    console.log(`===== HC自動計算関数終了 - ID=${employee.employeeId} =====`);
    
    return result;
  };
  
  // 表示するカラムを定義
  const columns = useMemo(() => {
    const baseColumns = [
      { title: 'No.', dataIndex: 'index', key: 'index', width: 60 },
      { title: '社員ID', dataIndex: 'employeeId', key: 'employeeId', width: 100 },
      { title: '氏名', dataIndex: 'name', key: 'name', width: 120 },
      { title: '障害区分', dataIndex: 'disabilityType', key: 'disabilityType', width: 120 },
      { title: '障害', dataIndex: 'disability', key: 'disability', width: 100 },
      { title: '等級', dataIndex: 'grade', key: 'grade', width: 80 },
      { 
        title: '採用日', 
        dataIndex: 'employmentDate', 
        key: 'employmentDate', 
        width: 120,
      },
      { 
        title: '状態', 
        dataIndex: 'status', 
        key: 'status',
        width: 100,
        render: (status: string) => (
          <Tag color={status === '在籍' ? 'green' : status === '退職' ? 'red' : 'orange'}>
            {status}
          </Tag>
        )
      },
    ];
    
    // 月次カラム（4月〜3月）
    const monthlyColumns = Array(12).fill(null).map((_, index) => {
      // 月の名称（4月〜3月）
      const monthNumber = index < 9 ? index + 4 : index - 8;
      const monthName = `${monthNumber}月`;
      
      return {
        title: (
          <Tooltip title="毎月1日時点での在籍状況">
            {monthName} <InfoCircleOutlined style={{ fontSize: '12px' }} />
          </Tooltip>
        ),
        dataIndex: ['monthlyHC', index],
        key: `month_${index}`,
        width: 60,
        align: 'center' as const,
        render: (value: number | string) => value || '-'
      };
    });
    
    // 備考と操作カラム
    const endColumns = [
      { title: '備考', dataIndex: 'remarks', key: 'remarks', width: 150 },
      { 
        title: '操作', 
        key: 'action',
        width: 80,
        render: (_: any, record: Employee) => (
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => openEditModal(record)} 
            className={styles.editIcon}
          />
        )
      },
    ];
    
    return [...baseColumns, ...monthlyColumns, ...endColumns];
  }, [editMode]);
  
  // インデックスを追加したデータ
  const dataWithIndex = useMemo(() => {
    return employees.map((item, index) => ({
      ...item,
      index: index + 1,
      key: item.employeeId,
    }));
  }, [employees]);
  
  // コンポーネントのマウント時にログ出力
  useEffect(() => {
    console.log('EmployeesTab マウント - 受け取った従業員データ:', data);
  }, [data]);
  
  return (
    <div className={styles.employeeDetailsContainer}>
      <div className={styles.sectionHeader}>
        <h3>従業員詳細</h3>
        <div className={styles.headerNote}>
          <InfoCircleOutlined /> 各月のカウントは月初1日時点の在籍者数を基準としています
        </div>
        <div className={styles.actionButtons}>
          <Button 
            type={editMode ? "primary" : "default"} 
            onClick={toggleEditMode}
          >
            {editMode ? '編集終了' : '編集'}
          </Button>
        </div>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={dataWithIndex} 
        pagination={false}
        className={styles.employeeTable}
        scroll={{ x: 'max-content' }}
        loading={loading}
        size="middle"
        bordered
      />
      
      {/* 従業員編集モーダル */}
      {editingEmployee && (
        <Modal
          title="従業員情報編集"
          open={isModalVisible}
          onCancel={closeEditModal}
          footer={null}
          width={700}
        >
          <Form
            layout="vertical"
            initialValues={{
              ...editingEmployee,
              employmentDate: editingEmployee.employmentDate ? dayjs(editingEmployee.employmentDate) : undefined,
              retirementDate: editingEmployee.retirementDate ? dayjs(editingEmployee.retirementDate) : undefined,
            }}
            onFinish={(values) => {
              // 日付をフォーマット
              const formattedValues = {
                ...values,
                employmentDate: values.employmentDate ? values.employmentDate.format('YYYY/MM/DD') : '',
                retirementDate: values.retirementDate ? values.retirementDate.format('YYYY/MM/DD') : undefined,
              };
              
              saveEmployeeData({
                ...editingEmployee,
                ...formattedValues,
              });
            }}
          >
            {/* フォームフィールド */}
            <Form.Item name="employeeId" label="社員ID" hidden>
              <Input />
            </Form.Item>
            
            <Form.Item name="name" label="氏名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            
            <Form.Item name="employmentDate" label="採用日" rules={[{ required: true }]}>
              <DatePicker format="YYYY/MM/DD" />
            </Form.Item>
            
            <Form.Item name="status" label="状態" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="在籍">在籍</Select.Option>
                <Select.Option value="休職">休職</Select.Option>
                <Select.Option value="退職">退職</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item 
              name="retirementDate" 
              label="退職日" 
              dependencies={['status']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue('status') === '退職' && !value) {
                      return Promise.reject(new Error('退職日を入力してください'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker format="YYYY/MM/DD" />
            </Form.Item>
            
            <Form.Item name="employmentType" label="雇用形態" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="正社員">正社員</Select.Option>
                <Select.Option value="短時間労働者">短時間労働者</Select.Option>
                <Select.Option value="パート">パート</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="disabilityType" label="障害区分" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="身体障害">身体障害</Select.Option>
                <Select.Option value="精神障害">精神障害</Select.Option>
                <Select.Option value="知的障害">知的障害</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="grade" label="等級">
              <Input />
            </Form.Item>
            
            <Form.Item name="remarks" label="備考">
              <Input.TextArea rows={3} />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={closeEditModal} style={{ marginLeft: 8 }}>キャンセル</Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeesTab;