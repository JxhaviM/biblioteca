import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminUsersPage from './pages/SuperAdminUsersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PersonManagementPage from './pages/PersonManagementPage';
import Navbar from './components/Navbar';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import './App.css';

interface User {
  id: string;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
  tieneCuenta: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Person {
  id: string;
  doc: string;
  apellido1: string;
  nombre1: string;
  email?: string;
  nombre?: string;
}

// Componente interno que tiene acceso a useNavigate
const AppRoutes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedPerson = localStorage.getItem('person');
      
      if (token && savedUser) {
        try {
          // Validar que el token sea válido haciendo una petición al backend
          const response = await fetch('/api/auth/validate', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            // Token válido, usar los datos guardados
            const userData = JSON.parse(savedUser);
            const personData = savedPerson ? JSON.parse(savedPerson) : null;
            setUser(userData);
            setPerson(personData);
            console.log('✅ Token válido, usuario autenticado:', userData.username);
          } else {
            // Token inválido, limpiar datos
            console.log('🚫 Token inválido, limpiando sesión');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('person');
          }
        } catch (error) {
          console.error('Error validating token or parsing user data:', error);
          // En caso de error, limpiar todo
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('person');
        }
      } else {
        console.log('📝 No hay token o datos de usuario guardados');
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Componente de ruta protegida
  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
    // Check both state and localStorage for user data
    let currentUser = user;
    
    // If no user in state, try to get from localStorage
    if (!currentUser) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
          // Update state with the parsed user data
          setUser(currentUser);
        } catch (error) {
          console.error('Error parsing user data in ProtectedRoute:', error);
        }
      }
    }
    
    if (!currentUser) {
      console.log('🚫 ProtectedRoute: No user found, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    
    if (!allowedRoles.includes(currentUser.role)) {
      console.log('🚫 ProtectedRoute: User role not allowed', { userRole: currentUser.role, allowedRoles });
      return <Navigate to="/unauthorized" replace />;
    }
    
    console.log('✅ ProtectedRoute: Access granted', { userRole: currentUser.role, allowedRoles });
    return <>{children}</>;
  };

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/30 rounded-full animate-spin border-t-white mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Sistema Biblioteca</h2>
            <p className="text-white/70">Iniciando aplicación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user && <Navbar />}
      
        <Routes>
          {/* Ruta de inicio - redirige según el rol del usuario */}
          <Route path="/" element={
            user ? (
              <RoleBasedRedirect />
            ) : (
              <HomePage />
            )
          } />
          
          {/* Ruta de login - redirige a HomePage donde está el modal */}
          <Route path="/login" element={
            user ? (
              <Navigate to={`/dashboard/${user.role}`} replace />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          
          {/* Dashboard SuperAdmin */}
          <Route path="/dashboard/superadmin" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Dashboard Admin */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Gestión de Usuarios - SuperAdmin */}
          <Route path="/superadmin/usuarios" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminUsersPage />
            </ProtectedRoute>
          } />

          {/* Gestión de Usuarios - Admin (solo usuarios regulares) */}
          <Route path="/admin/usuarios" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />

          {/* Gestión de Personas */}
          <Route path="/admin/personas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <PersonManagementPage />
            </ProtectedRoute>
          } />
          
          {/* Gestión de Personas - SuperAdmin */}
          <Route path="/superadmin/personas" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <PersonManagementPage />
            </ProtectedRoute>
          } />

          {/* Dashboard Usuario */}
        <Route path="/dashboard/user" element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']}>
            <div className="min-h-screen bg-gray-100 p-8">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  Dashboard de Usuario
                </h1>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600">
                    Bienvenido al dashboard de usuario. Esta página está en desarrollo.
                  </p>
                  {person && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900">Información Personal:</h3>
                      <p className="text-blue-700">
                        {person.nombre || `${person.nombre1} ${person.apellido1}`}
                      </p>
                      <p className="text-blue-600 text-sm">Documento: {person.doc}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Página de no autorizado */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">No Autorizado</h1>
              <p className="text-gray-600 mb-8">No tienes permisos para acceder a esta página.</p>
              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Volver
              </button>
            </div>
          </div>
        } />
        
        {/* Ruta catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
