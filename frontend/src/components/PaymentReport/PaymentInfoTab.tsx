import React, { useState, useEffect } from 'react';
import PaymentInfoForm from './PaymentInfoForm';
import PaymentCalculation from './PaymentCalculation';
import PaymentMonthlyData from './PaymentMonthlyData';
import { paymentReportApi } from '../../api/paymentReportApi';

interface PaymentInfoTabProps {
  fiscalYear: string;
}

// フォームデータの型定義
interface FormDataType {
  year: string;
  companyName: string;
  companyNameKana: string;
  representativeTitle: string;
  representativeName: string;
  corporateNumber: string;
  postalCode: string;
  address: string;
  industryClassification: string;
  industryClassificationCode: string;
  prefectureCode: string;
  employmentOfficeCode: string;
  
  // 月次雇用データ
  totalRegularEmployees: {
    [key: string]: number;
  };
  
  workerBaseCount: {
    [key: string]: number;
  };
  
  disabledEmployees: {
    [key: string]: number;
  };
  
  shortTimeDisabledEmployees: {
    [key: string]: number;
  };
  
  // 納付金計算関連データ
  legalEmploymentRate: number;
  paymentPerPerson: number;
  adjustmentPaymentPerPerson: number;
  homeWorkingAdjustmentRate: number;
  specialPaymentPerPerson: number;
  
  // 在宅就業障害者特例調整金関連
  homeWorkingPaymentTotal: number;
  homeWorkingDivisor: number;
  
  // 銀行口座情報
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  bankCode: string;
  branchCode: string;
}

const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({ fiscalYear }) => {
  const [formData, setFormData] = useState<FormDataType>({
    year: fiscalYear || '令和7',
    companyName: '株式会社サンプル',
    companyNameKana: 'カブシキガイシャサンプル',
    representativeTitle: '代表取締役',
    representativeName: '山田太郎',
    corporateNumber: '1234567890123',
    postalCode: '100-0001',
    address: '東京都千代田区千代田1-1-1',
    industryClassification: '製造業',
    industryClassificationCode: '26',
    prefectureCode: '13',
    employmentOfficeCode: '101',
    
    // 月次雇用データ
    totalRegularEmployees: {
      april: 120, may: 120, june: 121, july: 121, august: 121,
      september: 122, october: 122, november: 123, december: 123,
      january: 123, february: 123, march: 123
    },
    
    workerBaseCount: {
      april: 118, may: 118, june: 119, july: 119, august: 119,
      september: 120, october: 120, november: 121, december: 121,
      january: 121, february: 121, march: 121
    },
    
    disabledEmployees: {
      april: 3, may: 3, june: 3, july: 3, august: 3,
      september: 4, october: 4, november: 4, december: 4,
      january: 4, february: 4, march: 4
    },
    
    shortTimeDisabledEmployees: {
      april: 1, may: 1, june: 1, july: 1, august: 1,
      september: 1, october: 1, november: 1, december: 1,
      january: 1, february: 1, march: 1
    },
    
    // 納付金計算関連データ
    legalEmploymentRate: 2.3,
    paymentPerPerson: 50000,
    adjustmentPaymentPerPerson: 29000,
    homeWorkingAdjustmentRate: 21000,
    specialPaymentPerPerson: 7000,
    
    // 在宅就業障害者特例調整金関連
    homeWorkingPaymentTotal: 350000,
    homeWorkingDivisor: 35000,
    
    // 銀行口座情報
    bankName: 'サンプル銀行',
    branchName: '本店',
    accountType: '普通',
    accountNumber: '1234567',
    accountHolder: 'カ) サンプル',
    bankCode: '0123',
    branchCode: '456'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 年度数値を取得する
  const getYearValue = () => {
    if (fiscalYear.includes('年度')) {
      return parseInt(fiscalYear.replace('年度', ''));
    }
    return new Date().getFullYear();
  };

  // APIからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const year = getYearValue();
        const report = await paymentReportApi.getPaymentReport(year);
        
        // 取得したデータをフォームにセット
        if (report) {
          // APIから取得したデータを適切な形式に変換する処理が必要
          // 実際のAPIレスポンス形式によって実装方法は異なる
          // サンプルとしてのみ示す
          console.log('APIから取得したデータ:', report);
          
          // ここでフォームデータを更新
          // setFormData({ ... });
        }
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : '納付金レポートデータの取得に失敗しました');
        console.error('納付金レポートデータの取得エラー:', err);
      }
    };
    
    fetchData();
  }, [fiscalYear]);

  // データを保存する関数
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      
      const year = getYearValue();
      
      // APIに送信するデータを整形
      const paymentReportData = {
        year,
        total_employees: Object.values(formData.totalRegularEmployees).reduce((a, b) => a + b, 0) / 12,
        disabled_employees: Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0) / 12,
        employment_rate: (Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0) / 
          Object.values(formData.totalRegularEmployees).reduce((a, b) => a + b, 0)) * 100,
        legal_employment_rate: formData.legalEmploymentRate,
        shortage_count: Math.max(0, 
          Math.floor((Object.values(formData.workerBaseCount).reduce((a, b) => a + b, 0) * formData.legalEmploymentRate / 100)) - 
          Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0)
        ),
        payment_amount: calculatePaymentAmount(),
        notes: `${fiscalYear}の納付金レポート`,
        company_data: JSON.stringify({
          companyName: formData.companyName,
          companyNameKana: formData.companyNameKana,
          representativeTitle: formData.representativeTitle,
          representativeName: formData.representativeName,
          corporateNumber: formData.corporateNumber,
          postalCode: formData.postalCode,
          address: formData.address,
          industryClassification: formData.industryClassification,
          industryClassificationCode: formData.industryClassificationCode,
          prefectureCode: formData.prefectureCode,
          employmentOfficeCode: formData.employmentOfficeCode,
        }),
        monthly_data: JSON.stringify({
          totalRegularEmployees: formData.totalRegularEmployees,
          workerBaseCount: formData.workerBaseCount,
          disabledEmployees: formData.disabledEmployees,
          shortTimeDisabledEmployees: formData.shortTimeDisabledEmployees,
        }),
        bank_info: JSON.stringify({
          bankName: formData.bankName,
          branchName: formData.branchName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
          bankCode: formData.bankCode,
          branchCode: formData.branchCode,
        }),
        status: '作成中'
      };
      
      // 納付金レポートを保存
      await paymentReportApi.savePaymentReport(year, paymentReportData);
      
      setLoading(false);
      setSaveSuccess(true);
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金レポートの保存に失敗しました');
      console.error('納付金レポートの保存エラー:', err);
    }
  };

  // 申告する関数
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = getYearValue();
      
      // 納付金レポートを確定
      await paymentReportApi.confirmPaymentReport(year);
      
      setLoading(false);
      alert('納付金の申告が完了しました。');
      
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '納付金レポートの申告に失敗しました');
      console.error('納付金レポートの申告エラー:', err);
    }
  };

  // 納付金額を計算する関数
  const calculatePaymentAmount = () => {
    // 法定雇用障害者数の年間合計
    const totalLegalEmployment = Math.floor(
      Object.values(formData.workerBaseCount).reduce((a, b) => a + b, 0) * 
      formData.legalEmploymentRate / 100
    );
    
    // 障害者雇用数の年間合計
    const totalDisabledEmployees = Object.values(formData.disabledEmployees).reduce((a, b) => a + b, 0);
    
    // 不足している場合のみ納付金が発生
    const shortage = Math.max(0, totalLegalEmployment - totalDisabledEmployees);
    const paymentA = shortage * formData.paymentPerPerson;
    
    // 在宅就業障害者特例調整金の計算
    const count = Math.floor(formData.homeWorkingPaymentTotal / formData.homeWorkingDivisor);
    const paymentB = Math.min(
      count * formData.homeWorkingAdjustmentRate,
      totalDisabledEmployees * formData.homeWorkingAdjustmentRate
    );
    
    // 納付金額 = A - B（ただし0未満にはならない）
    return Math.max(0, paymentA - paymentB);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">納付金情報</h2>
      
      {loading && <div className="text-center py-4">データを読み込み中...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>納付金レポートを保存しました。</p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded shadow">
        {/* 事業主情報 */}
        <PaymentInfoForm formData={formData} />
        
        {/* 月別データ */}
        <PaymentMonthlyData formData={formData} />
        
        {/* 納付金計算 */}
        <PaymentCalculation formData={formData} />
        
        {/* 操作ボタン類 */}
        <div className="flex justify-end gap-4 mt-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleSave}
            disabled={loading}
          >
            保存する
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            PDFで出力
          </button>
          <button 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            申告する
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoTab;