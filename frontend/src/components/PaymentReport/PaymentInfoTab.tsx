//PaymentInfoTab.tsx 

import React, { useState } from 'react';
import PaymentInfoForm from './PaymentInfoForm';
import PaymentCalculation from './PaymentCalculation';
import PaymentMonthlyData from './PaymentMonthlyData';

interface PaymentInfoTabProps {
  fiscalYear: string;
}

const PaymentInfoTab: React.FC<PaymentInfoTabProps> = ({ fiscalYear }) => {
  // 納付金情報データ（添付ファイル参照のデータ）
  const [formData, setFormData] = useState({
    year: '令和7',
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

  return (
    <div className="payment-info-container">
      <h3 className="tab-title">納付金情報 ({fiscalYear})</h3>
      
      <div className="border-2 border-gray-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">様式第101号</div>
          <div className="text-xl font-bold">10100</div>
        </div>
        
        <div className="text-center font-bold text-lg mb-6">
          {formData.year}年度<br />
          障害者雇用納付金申告書、障害者雇用調整金、在宅就業障害者特例調整金及び特例給付金支給申請書<br />
          (常用雇用労働者の総数が100人を超える事業主用)
        </div>
        
        <div className="text-right mb-4">
          <p>下記のとおり申告・申請します。</p>
          <p className="font-bold">独立行政法人高齢・障害・求職者雇用支援機構理事長　殿</p>
        </div>
        
        <div className="flex justify-end mb-6">
          <div className="w-48">
            <div className="border border-gray-800 p-2 mb-2">
              <p className="text-sm">令和　　年　　月　　日</p>
            </div>
          </div>
        </div>
        
        {/* 申告情報フォーム */}
        <PaymentInfoForm formData={formData} />
        
        {/* 計算プロセスと結果 */}
        <PaymentCalculation formData={formData} />
        
        {/* 月別データテーブル */}
        <PaymentMonthlyData formData={formData} />
        
        {/* 操作ボタン類 */}
        <div className="flex justify-end gap-4 mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">保存する</button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">PDFで出力</button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">申告する</button>
        </div>
        
        <div className="text-center text-sm mt-6">
          <p>※「記入上の注意」をよく読んで記入してください。</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoTab;