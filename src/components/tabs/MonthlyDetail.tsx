import React from 'react';

const MonthlyDetail: React.FC = () => {
  return (
    <div className="monthly-detail-tab">
      <h3>月次詳細</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>年月</th>
            <th>常用労働者数</th>
            <th>障害者数</th>
            <th>雇用カウント</th>
            <th>実雇用率</th>
            <th>法定雇用率</th>
            <th>不足数</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024年4月</td>
            <td>525</td>
            <td>5</td>
            <td>12.75</td>
            <td>2.43%</td>
            <td>2.3%</td>
            <td>0</td>
          </tr>
          <tr>
            <td>2024年5月</td>
            <td>525</td>
            <td>5</td>
            <td>12.75</td>
            <td>2.43%</td>
            <td>2.3%</td>
            <td>0</td>
          </tr>
          <tr>
            <td>2024年6月</td>
            <td>530</td>
            <td>5</td>
            <td>12.75</td>
            <td>2.41%</td>
            <td>2.3%</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyDetail;