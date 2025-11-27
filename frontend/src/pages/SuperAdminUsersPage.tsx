import React from 'react';
import UserManagementPage from './UserManagementPage';

const SuperAdminUsersPage: React.FC = () => {
  return <UserManagementPage currentUserRole="superadmin" />;
};

export default SuperAdminUsersPage;
