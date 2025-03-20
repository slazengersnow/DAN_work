import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 250px;
  background-color: #f0f2f5;
  border-right: 1px solid #e0e0e0;
  height: 100%;
  writing-mode: horizontal-tb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const MenuTitle = styled.div`
  padding: 15px 20px;
  color: #666;
  font-size: 14px;
  writing-mode: horizontal-tb;
  white-space: nowrap;
  margin-top: 10px;
`;

interface MenuLinkProps {
  isActive: boolean;
}

const MenuLink = styled(Link)<MenuLinkProps>`
  display: block;
  padding: 15px 20px;
  text-decoration: none;
  color: ${props => props.isActive ? '#0d6efd' : '#333'};
  background-color: ${props => props.isActive ? '#e7f1ff' : 'transparent'};
  border-left: ${props => props.isActive ? '4px solid #0d6efd' : '4px solid transparent'};
  writing-mode: horizontal-tb;
  text-orientation: mixed;
  white-space: nowrap;
  font-size: 14px;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e6e9ed;
  }
`;

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };
  
  return (
    <SidebarContainer>
      <MenuTitle>メニュー</MenuTitle>
      
      <nav>
        <MenuLink to="/dashboard" isActive={isActive('/dashboard') || location.pathname === '/'}>
          ダッシュボード
        </MenuLink>
        
        <MenuLink to="/employee-list" isActive={isActive('/employee-list')}>
          社員リスト
        </MenuLink>
        
        <MenuLink to="/monthly-report" isActive={isActive('/monthly-report')}>
          月次報告
        </MenuLink>
        
        <MenuLink to="/payment-report" isActive={isActive('/payment-report')}>
          納付金申告
        </MenuLink>
        
        <MenuLink to="/settings" isActive={isActive('/settings')}>
          設定
        </MenuLink>
      </nav>
    </SidebarContainer>
  );
};

export default Sidebar;