// PaymentInfoForm.tsx

import React from 'react';

interface PaymentInfoFormProps {
  formData: any;
}

const PaymentInfoForm: React.FC<PaymentInfoFormProps> = ({ formData }) => {
  return (
    <div className="border border-gray-800 mb-6">
      <div className="grid grid-cols-4 border-b border-gray-800">
        <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">①申告申請事業主</div>
        <div className="col-span-3 p-2">
          <div className="flex mb-2">
            <div className="w-16 text-right mr-2">法人番号</div>
            <div className="border border-gray-300 px-2 py-1 w-64">{formData.corporateNumber}</div>
          </div>
          <div className="flex mb-2">
            <div className="w-16 text-right mr-2">フリガナ</div>
            <div className="border border-gray-300 px-2 py-1 w-64">{formData.companyNameKana}</div>
          </div>
          <div className="flex mb-2">
            <div className="w-16 text-right mr-2">名称</div>
            <div className="border border-gray-300 px-2 py-1 w-64">{formData.companyName}</div>
            <div className="ml-4">
              <div className="flex">
                <div className="w-24 text-right mr-2">代表者の役職</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{formData.representativeTitle}</div>
              </div>
              <div className="flex mt-2">
                <div className="w-24 text-right mr-2">氏名</div>
                <div className="border border-gray-300 px-2 py-1 w-32">{formData.representativeName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 border-b border-gray-800">
        <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">③住所</div>
        <div className="col-span-3 p-2">
          <div className="flex mb-2">
            <div className="w-16 text-right mr-2">郵便番号</div>
            <div className="border border-gray-300 px-2 py-1 w-24">{formData.postalCode}</div>
          </div>
          <div className="border border-gray-300 px-2 py-1 w-full">{formData.address}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-5">
        <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">④産業分類</div>
        <div className="col-span-2 border-r border-gray-800 p-2">
          <div className="border border-gray-300 px-2 py-1">{formData.industryClassification}（{formData.industryClassificationCode}）</div>
        </div>
        <div className="col-span-1 border-r border-gray-800 bg-gray-100 p-2 font-bold">②都道府県・職安コード</div>
        <div className="col-span-1 p-2">
          <div className="border border-gray-300 px-2 py-1">{formData.prefectureCode}-{formData.employmentOfficeCode}</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoForm;