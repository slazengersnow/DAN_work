import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-title">障害者雇用管理システム</div>
      <div className="header-actions">
        <button className="btn btn-secondary">?</button>
        <button className="btn btn-secondary">!</button>
        <button className="btn btn-secondary">⚙</button>
        <button className="btn btn-secondary">A</button>
      </div>
    </header>
  );
};

export default Header;