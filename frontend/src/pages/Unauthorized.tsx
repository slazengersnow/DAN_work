import React from 'react';

const Unauthorized: React.FC = () => {
  return (
    <div className="container">
      <h1>アクセス権限がありません</h1>
      <p>このページを閲覧するための権限がありません。</p>
      <a href="/login">ログインページに戻る</a>
    </div>
  );
};

export default Unauthorized;