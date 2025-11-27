import React from 'react';
import Sidebar from './Sidebar';

interface SidebarWrapperProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const SidebarWrapper: React.FC<SidebarWrapperProps> = ({ onCollapseChange }) => {
  return <Sidebar onCollapseChange={onCollapseChange} />;
};

export default SidebarWrapper;
