import React from 'react';
import Sidebar from './Sidebar';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const TopBar = styled.div`
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 20px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarContainer = styled.div`
  /* サイドバーコンテナのスタイル */
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px 30px;
  background-color: #fff;
  overflow: auto;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <TopBar>DIwork</TopBar>
      <ContentContainer>
        <SidebarContainer>
          <Sidebar />
        </SidebarContainer>
        <MainContent>
          {children}
        </MainContent>
      </ContentContainer>
    </LayoutContainer>
  );
};

export default Layout;