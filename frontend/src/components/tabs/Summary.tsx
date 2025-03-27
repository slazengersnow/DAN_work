import React from 'react';

const Summary: React.FC = () => {
  return (
    <div className="summary-tab">
      <h3>障害者雇用者詳細</h3>
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
            <th>カウント</th>
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
            <td>1</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Summary;