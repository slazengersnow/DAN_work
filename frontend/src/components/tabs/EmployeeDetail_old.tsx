import React from 'react';

const EmployeeDetail: React.FC = () => {
  return (
    <div className="employee-detail-tab">
      <h3>従業員詳細情報</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>社員ID</th>
            <th>氏名</th>
            <th>障害区分</th>
            <th>障害</th>
            <th>等級</th>
            <th>採用日</th>
            <th>在籍状況</th>
            <th>4月</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>1001</td>
            <td>山田 太郎</td>
            <td>身体障害</td>
            <td>視覚</td>
            <td>1級</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>2</td>
          </tr>
          <tr>
            <td>2</td>
            <td>2222</td>
            <td>鈴木 花子</td>
            <td>身体障害</td>
            <td>聴覚</td>
            <td>4級</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
          <tr>
            <td>3</td>
            <td>3333</td>
            <td>佐藤 一郎</td>
            <td>知的障害</td>
            <td>-</td>
            <td>B</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
          <tr>
            <td>4</td>
            <td>4444</td>
            <td>高橋 勇太</td>
            <td>精神障害</td>
            <td>ADHD</td>
            <td>3級</td>
            <td>2020/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
          <tr>
            <td>5</td>
            <td>5555</td>
            <td>田中 美咲</td>
            <td>精神障害</td>
            <td>うつ病</td>
            <td>2級</td>
            <td>2021/04/01</td>
            <td className="status-active">在籍</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeDetail;