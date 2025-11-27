import React, { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import ChangePasswordModal from './ChangePasswordModal';
import type { User, Person } from '../api/auth';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Usar el hook useUserData para obtener la información del usuario
  const { user, person, refreshUserData } = useUserData();
  
  // Hook de autenticación
  const { logout } = useAuth({});

  // Función para obtener el nombre a mostrar
  const getDisplayName = () => {
    if (!user) return 'Usuario';
    
    // Si tenemos la información de la persona, usamos sus datos
    if (person) {
      // Usamos nombre1 y apellido1 que son los campos estándar
      const nombre = person.nombre1 || '';
      const apellido = person.apellido1 || '';
      
      // Si tiene al menos un nombre o apellido, lo mostramos
      if (nombre || apellido) {
        return `${nombre} ${apellido}`.trim();
      }
    }
    
    // Si no hay información de persona o no tiene nombre/apellido, usamos el username
    return user.username || 'Usuario';
  };

  // Función para verificar si es superadmin master
  const isSuperAdminMaster = () => {
    if (!user) return false;
    return user.role === 'superadmin' && (user.isMasterSuperAdmin === true || (user as any).isMasterSuperAdmin === true);
  };

  // Función para formatear el rol del usuario
  const formatRole = (role: string | undefined) => {
    if (!role) return '';
    
    // Si es superadmin master, mostrar título especial
    if (role === 'superadmin' && isSuperAdminMaster()) {
      return '👑 Super Admin Master';
    }
    
    switch(role.toLowerCase()) {
      case 'admin':
        return 'Bibliotecario';
      case 'superadmin':
        return 'Super Administrador';
      case 'user':
        return 'Usuario';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Función para obtener las iniciales del usuario
  const getInitials = () => {
    if (!user) return 'U';
    
    // Si es superadmin master, mostrar corona
    if (user.role === 'superadmin' && isSuperAdminMaster()) {
      return '👑';
    }
    
    // Si tenemos información de la persona, usamos sus iniciales
    if (person) {
      const firstLetter = person.nombre1?.[0] || '';
      const secondLetter = person.apellido1?.[0] || '';
      
      if (firstLetter || secondLetter) {
        return `${firstLetter}${secondLetter}`.toUpperCase();
      }
    }
    
    // Si no hay información de persona, usamos la primera letra del username
    return user.username?.[0]?.toUpperCase() || 'U';
  };
  
  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // No cerrar si se hizo clic en el menú de usuario o en sus hijos
      if (target.closest('#user-menu') || target.closest('#user-menu-dropdown') || target.closest('#user-menu-dropdown *')) {
        return;
      }
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMenuOpen]);
  
  // Manejar clic en los elementos del menú
  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsUserMenuOpen(false);
  };

  // Configuración de menús por rol - Mejorado para SuperAdmin
  const getMenuItems = () => {
    if (!user) return [];

    const commonItems = [];
    
    // Elementos comunes para admin
    if (user.role === 'admin') {
      commonItems.push(
        { path: '/admin/usuarios', label: 'Usuarios' },
        { path: '/admin/personas', label: 'Gestión de Personas' },
        { path: '/admin/libros', label: 'Libros' },
        { path: '/loans', label: 'Préstamos' },
        { path: '/superadmin/reportes', label: 'Reportes' }
      );
    }

    // Elementos específicos por rol
    switch (user.role) {
      case 'superadmin':
        return [
          { path: '/dashboard/superadmin', label: 'Dashboard' },
          { path: '/superadmin/usuarios', label: 'Usuarios' },
          { path: '/admin/personas', label: 'Personas' },
          { path: '/admin/libros', label: 'Libros' },
          { path: '/loans', label: 'Préstamos' },
          { path: '/admin/logs', label: 'Registros del Sistema' },
          { path: '/superadmin/sesiones', label: 'Sesiones Activas' },
          { path: '/superadmin/reportes', label: 'Reportes' },
          { path: '/superadmin/config', label: 'Configuración' },
        ];
      case 'admin':
        return [
          { path: '/dashboard/admin', label: 'Inicio' },
          ...commonItems,
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
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl">📚</span>
                <span className="ml-2 text-xl font-bold">Biblioteca</span>
              </Link>
            </div>

            {/* Menú principal */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isItemActive(item) 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Menú de usuario */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="ml-3 relative">
                  <div>
                    <button
                      type="button"
                      className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      id="user-menu"
                      aria-expanded="false"
                      aria-haspopup="true"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <span className="sr-only">Abrir menú de usuario</span>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold" 
                       style={{ 
                         backgroundColor: isSuperAdminMaster() ? '#f59e0b' : '#3b82f6',
                         border: isSuperAdminMaster() ? '2px solid #fbbf24' : 'none'
                       }}>
                        {getInitials()}
                      </div>
                      <div className="ml-2 text-left">
                        <div className="text-sm font-medium text-gray-700">{getDisplayName()}</div>
                        <div className="text-xs text-gray-500">{formatRole(user?.role)}</div>
                      </div>
                    </button>
                  </div>

                  {isUserMenuOpen && (
                    <div 
                      id="user-menu-dropdown"
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50" 
                      role="menu" 
                      aria-orientation="vertical" 
                      aria-labelledby="user-menu"
                      onClick={(e) => e.stopPropagation()} // Prevenir que el clic se propague al documento
                    >
                      <Link
                        to="/perfil"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={(e) => handleMenuItemClick(() => {})}
                      >
                        👤 Mi Perfil
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuItemClick(() => setIsChangePasswordModalOpen(true));
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        🔑 Cambiar Contraseña
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuItemClick(logout);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        role="menuitem"
                      >
                        🚪 Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de menú móvil */}
            <div className="-mr-2 flex md:hidden">
              <button
                type="button"
                className="bg-white p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-expanded="false"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Abrir menú principal</span>
                {isMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isItemActive(item)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                       style={{ 
                         backgroundColor: isSuperAdminMaster() ? '#f59e0b' : '#3b82f6',
                         border: isSuperAdminMaster() ? '2px solid #fbbf24' : 'none'
                       }}>
                    {getInitials()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{getDisplayName()}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  to="/perfil"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  👤 Mi Perfil
                </Link>
                <button
                  onClick={() => {
                    setIsChangePasswordModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  🔑 Cambiar Contraseña
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
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

const NavbarWithRouter = (props: NavbarProps) => {
  return <Navbar {...props} />;
};

export default NavbarWithRouter;