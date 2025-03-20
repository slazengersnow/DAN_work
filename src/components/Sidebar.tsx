import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 240px;
  background-color: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  height: 100%;
  writing-mode: horizontal-tb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const MenuTitle = styled.div`
  padding: 10px 20px;
  color: #666;
  font-size: 14px;
  writing-mode: horizontal-tb;
  white-space: nowrap;
`;

interface MenuLinkProps {
  isActive: boolean;
}

const MenuLink = styled(Link)<MenuLinkProps>`
  display: block;
  padding: 12px 20px;
  text-decoration: none;
  color: ${props => props.isActive ? '#4169e1' : '#333'};
  background-color: ${props => props.isActive ? '#e8f0fe' : 'transparent'};
  border-left: ${props => props.isActive ? '3px solid #4169e1' : '3px solid transparent'};
  writing-mode: horizontal-tb;
  text-orientation: mixed;
  white-space: nowrap;
  font-size: 14px;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f7ff;
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
        <MenuLink to="/dashboard" isActive={isActive('/dashboard')}>
          ダッシュボード
        </MenuLink>
        
        <MenuLink to="/employees" isActive={isActive('/employees')}>
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