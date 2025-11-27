import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user } = useUserData();

  // Solo mostrar sidebar para usuarios autenticados
  if (!user) {
    return <div>{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (opcional, para notificaciones o info adicional) */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Gestión de Biblioteca
            </h1>
            {/* Aquí podríamos agregar notificaciones, reloj, etc. */}
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
