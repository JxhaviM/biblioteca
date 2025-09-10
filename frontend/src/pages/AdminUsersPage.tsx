import React from 'react';
import UserManagementPage from './UserManagementPage';

const AdminUsersPage: React.FC = () => {
  return <UserManagementPage currentUserRole="admin" />;
};

export default AdminUsersPage;
