import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import HomePage from './pages/HomePage';
import LoginModal from './components/LoginModal';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminUsersPage from './pages/SuperAdminUsersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ProfilePage from './pages/ProfilePage';
import BooksAdminPage from './pages/BooksAdminPage';
import LoansPage from './pages/LoansPage';
import PersonManagementPage from './pages/PersonManagementPage';
import SystemLogsPage from './pages/SystemLogsPage';
import SystemConfigPage from './pages/SystemConfigPage';
import SessionsManagementPage from './pages/SessionsManagementPage';
import ReportsPage from './pages/ReportsPage';
import PublicBooksPage from './pages/PublicBooksPage';
import UserBooksPage from './pages/UserBooksPage';
import UserDashboard from './pages/UserDashboard';
import UserLoansPage from './pages/UserLoansPage';

import { NotificationProvider } from './components/NotificationSystem';
import { NotificationProvider as ToastNotificationProvider } from './components/NotificationContainer';
import MainLayout from './components/MainLayout';
import { UserProvider, useUserContext } from './contexts/UserContext';
import type { User, Person } from './api/auth';

const AppRoutes: React.FC = () => {
  const { user, person, loading } = useUserContext();
  const navigate = useNavigate();

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Componente para proteger rutas según roles
  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
    // Si está cargando, mostrar spinner en lugar de redirigir
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      );
    }
    
    // Solo redirigir si ya terminó de cargar y no hay usuario
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <>{children}</>;
  };

  // Función para manejar el login desde el header - será manejada por HomePageWrapper
  const createLoginHandler = () => {
    // Esta función se creará dinámicamente en HomePageWrapper
    return () => {};
  };

  // Componente que combina MainLayout con HomePageWrapper y maneja el login
  const HomePageWithLayout = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

    // Cargar datos del usuario desde localStorage
    useEffect(() => {
      const savedUser = localStorage.getItem('user');
      const savedPerson = localStorage.getItem('person');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      if (savedPerson) setCurrentPerson(JSON.parse(savedPerson));
    }, []);

    const handleLoginClick = () => {
      setShowLoginModal(true);
    };

    const handleLoginSuccess = (userData: any) => {
      setCurrentUser(userData.user);
      setCurrentPerson(userData.person);
      setShowLoginModal(false);
      
      // Redirigir según el rol
      if (userData.user.role === 'user') {
        navigate('/dashboard/user', { replace: true });
      } else if (userData.user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (userData.user.role === 'superadmin') {
        navigate('/dashboard/superadmin', { replace: true });
      }
    };

    return (
      <MainLayout showSidebar={false} onLoginClick={handleLoginClick}>
        <HomePage 
          user={currentUser}
          person={currentPerson}
          setUser={setCurrentUser}
          setPerson={setCurrentPerson}
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </MainLayout>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg font-medium">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login o redirección al dashboard */}
      <Route
        path="/"
        element={user ? <Navigate to={`/dashboard/${user.role}`} replace /> : 
          <HomePageWithLayout />
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to={`/dashboard/${user.role}`} replace /> : 
          <HomePageWithLayout />
        }
      />

      {/* Rutas públicas */}
      <Route
        path="/libros"
        element={
          <MainLayout showSidebar={false}>
            <PublicBooksPage />
          </MainLayout>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/dashboard/superadmin"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <MainLayout showSidebar={true}>
              <SuperAdminDashboard 
                user={user}
                person={person}
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <MainLayout showSidebar={true}>
              <AdminDashboard 
                user={user}
                currentUserRole={user?.role as 'superadmin' | 'admin'}
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']}>
            <MainLayout showSidebar={true}>
              <UserDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-prestamos"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']}>
            <MainLayout showSidebar={true}>
              <UserLoansPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/usuarios"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <MainLayout showSidebar={true}>
              <SuperAdminUsersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <MainLayout showSidebar={true}>
              {user?.role === 'superadmin' ? <SuperAdminUsersPage /> : <AdminUsersPage />}
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/personas"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <MainLayout showSidebar={true}>
              <PersonManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/libros"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <MainLayout showSidebar={true}>
              <BooksAdminPage 
                user={user}
                person={person}
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <MainLayout showSidebar={true}>
              <SystemLogsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/config"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <MainLayout showSidebar={true}>
              <SystemConfigPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/sesiones"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <MainLayout showSidebar={true}>
              <SessionsManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/reportes"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <MainLayout showSidebar={true}>
              <ReportsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']}>
            <MainLayout showSidebar={true}>
              <LoansPage 
                user={user}
                person={person}
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <MainLayout showSidebar={true}>
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Reportes</h1>
                <p>Página de reportes en construcción...</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Página no autorizada */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h1 className="text-4xl font-bold text-red-600 mb-4">No Autorizado</h1>
              <p className="text-gray-600 mb-8">No tienes permisos para acceder a esta página.</p>
              <button
                onClick={() => navigate(user ? `/dashboard/${user.role}` : '/')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Volver
              </button>
            </div>
          </div>
        }
      />

      {/* Redirección a inicio si la ruta no existe */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// 🔧 CORRECCIÓN FINAL: faltaba cerrar la exportación
function App() {
  return (
    <NotificationProvider>
      <ToastNotificationProvider>
        <UserProvider>
          <Router>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </Router>
        </UserProvider>
      </ToastNotificationProvider>
    </NotificationProvider>
  );
}

export default App;
