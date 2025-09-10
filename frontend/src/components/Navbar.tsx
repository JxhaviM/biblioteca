import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/auth';
import ChangePasswordModal from './ChangePasswordModal';
import type { User, Person } from '../api/auth';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Cargar datos del usuario al montar el componente
    const currentUser = authAPI.getCurrentUser();
    const currentPerson = authAPI.getCurrentPerson();
    
    setUser(currentUser);
    setPerson(currentPerson);
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setPerson(null);
    navigate('/', { replace: true });
  };

  // Configuración de menús por rol - Mejorado para SuperAdmin
  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'superadmin':
        return [
          { path: '/dashboard/superadmin', label: 'Dashboard', icon: '📊', exact: true },
          { path: '/superadmin/usuarios', label: 'Usuarios', icon: '👥' },
          { path: '/superadmin/personas', label: 'Personas', icon: '👤' },
          { path: '/superadmin/libros', label: 'Libros', icon: '📚' },
          { path: '/superadmin/prestamos', label: 'Préstamos', icon: '📖' },
          { path: '/superadmin/asistencia', label: 'Asistencia', icon: '📝' },
          { path: '/superadmin/espacios', label: 'Espacios', icon: '🏢' },
          { path: '/superadmin/reportes', label: 'Reportes', icon: '📈' },
          { path: '/superadmin/config', label: 'Sistema', icon: '⚙️' }
        ];

      case 'admin':
        return [
          { path: '/dashboard/admin', label: 'Dashboard', icon: '🏠', exact: true },
          { path: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
          { path: '/admin/personas', label: 'Personas', icon: '👤' },
          { path: '/admin/libros', label: 'Libros', icon: '📚' },
          { path: '/admin/prestamos', label: 'Préstamos', icon: '📖' },
          { path: '/admin/asistencia', label: 'Asistencia', icon: '📝' },
          { path: '/admin/espacios', label: 'Espacios', icon: '🏢' },
          { path: '/admin/reportes', label: 'Reportes', icon: '📊' }
        ];

      case 'user':
        return [
          { path: '/dashboard/user', label: 'Inicio', icon: '🏠', exact: true },
          { path: '/libros', label: 'Catálogo', icon: '📚' },
          { path: '/mis-prestamos', label: 'Mis Préstamos', icon: '📖' },
          { path: '/espacios', label: 'Reservar Espacios', icon: '🏢' },
          { path: '/mis-reservas', label: 'Mis Reservas', icon: '📅' }
        ];

      default:
        return [{ path: '/dashboard/user', label: 'Dashboard', icon: '🏠', exact: true }];
    }
  };

  const menuItems = getMenuItems();

  // Función para verificar si un item está activo
  const isItemActive = (item: { path: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  if (!user) {
    // Navbar para usuarios no autenticados - Mejorado responsive
    return (
      <nav className={`bg-white shadow-lg border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">📚</span>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-gray-900">Biblioteca</span>
                <span className="text-xs text-gray-500 hidden sm:block">Sistema de Gestión</span>
              </div>
            </Link>

            {/* Botones de autenticación */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 text-sm font-medium transition-colors"
              >
                Catálogo
              </Link>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
    <nav className={`bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y rol */}
          <div className="flex items-center space-x-3">
            <Link to={menuItems[0]?.path || '/dashboard'} className="flex items-center space-x-2">
              <span className="text-2xl">📚</span>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-gray-900">Biblioteca</span>
                <span className="text-xs text-gray-500 hidden sm:block">IE San Pedro Claver</span>
              </div>
            </Link>
            
            {/* Badge de rol */}
            <div className="hidden sm:block">
              {user.role === 'superadmin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  🔑 SuperAdmin
                </span>
              )}
              {user.role === 'admin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  👨‍💼 Admin
                </span>
              )}
              {user.role === 'user' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  👤 Usuario
                </span>
              )}
            </div>
          </div>

          {/* Menú desktop - Scrollable horizontalmente en tablets */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto max-w-2xl">
            <div className="flex items-center space-x-1 min-w-max">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isItemActive(item)
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Información del usuario y controles */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Información del usuario - Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {person ? `${person.nombre1} ${person.apellido1}` : user.username}
                </div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
              
              {/* Avatar */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {person ? person.nombre1.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {/* Dropdown del usuario */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        to="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        👤 Mi Perfil
                      </Link>
                      <Link
                        to="/configuracion"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ⚙️ Configuración
                      </Link>
                      <button
                        onClick={() => {
                          setIsChangePasswordModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        🔑 Cambiar Contraseña
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        🚪 Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de logout compacto para tablets */}
            <button
              onClick={handleLogout}
              className="hidden md:block lg:hidden bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors"
              title="Cerrar Sesión"
            >
              🚪
            </button>

            {/* Botón del menú móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil mejorado */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {/* Información del usuario en móvil */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {person ? person.nombre1.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {person ? `${person.nombre1} ${person.apellido1}` : user.username}
                  </div>
                  <div className="text-xs text-gray-500 capitalize flex items-center space-x-1">
                    <span>{user.role}</span>
                    {user.role === 'superadmin' && <span>🔑</span>}
                    {user.role === 'admin' && <span>👨‍💼</span>}
                    {user.role === 'user' && <span>👤</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Items del menú */}
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isItemActive(item)
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Acciones del usuario en móvil */}
            <div className="px-2 pt-2 pb-3 border-t border-gray-200 space-y-1">
              <Link
                to="/perfil"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="text-lg">👤</span>
                <span>Mi Perfil</span>
              </Link>
              <Link
                to="/configuracion"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="text-lg">⚙️</span>
                <span>Configuración</span>
              </Link>
              <button
                onClick={() => {
                  setIsChangePasswordModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="text-lg">🔑</span>
                <span>Cambiar Contraseña</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-md text-base font-medium text-red-700 hover:bg-red-50"
              >
                <span className="text-lg">🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
    
    {/* Modal de cambio de contraseña */}
    {user && (
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        username={user.username}
      />
    )}
    </>
  );
};

export default Navbar;