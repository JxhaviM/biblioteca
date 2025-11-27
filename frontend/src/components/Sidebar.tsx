import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import type { User, Person } from '../api/auth';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Activity,
  Library,
  Clock,
  UserCircle
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  badge?: string;
  exact?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '', onClose, onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, person, refreshUserData } = useUserData();
  const { logout } = useAuth({});

  // Función para obtener el nombre a mostrar
  const getDisplayName = () => {
    if (!user) return 'Usuario';
    
    if (person) {
      const nombre = person.nombre1 || '';
      const apellido = person.apellido1 || '';
      
      if (nombre || apellido) {
        return `${nombre} ${apellido}`.trim();
      }
    }
    
    return user.username || 'Usuario';
  };

  // Función para obtener los items del menú según el rol
  const getMenuItems = (): MenuItem[] => {
    if (!user) return [];

    switch (user.role) {
      case 'superadmin':
        return [
          {
            path: '/dashboard/superadmin',
            label: 'Dashboard',
            icon: LayoutDashboard,
            exact: true
          },
          {
            path: '/admin/usuarios',
            label: 'Gestión de Usuarios',
            icon: Users,
            exact: false
          },
          {
            path: '/admin/personas',
            label: 'Gestión de Personas',
            icon: UserCircle,
            exact: false
          },
          {
            path: '/admin/libros',
            label: 'Gestión de Libros',
            icon: BookOpen,
            exact: false
          },
          {
            path: '/loans',
            label: 'Préstamos',
            icon: Calendar,
            exact: false
          },
          {
            path: '/superadmin/reportes',
            label: 'Reportes y Estadísticas',
            icon: BarChart3,
            exact: false
          },
          {
            path: '/admin/logs',
            label: 'Registros del Sistema',
            icon: FileText,
            exact: false
          },
          {
            path: '/superadmin/sesiones',
            label: 'Sesiones Activas',
            icon: Activity,
            exact: false
          },
          {
            path: '/superadmin/config',
            label: 'Configuración',
            icon: Settings,
            exact: false
          }
        ];

      case 'admin':
        return [
          {
            path: '/dashboard/admin',
            label: 'Dashboard',
            icon: LayoutDashboard,
            exact: true
          },
          {
            path: '/admin/usuarios',
            label: 'Gestión de Usuarios',
            icon: Users,
            exact: false
          },
          {
            path: '/admin/personas',
            label: 'Gestión de Personas',
            icon: UserCircle,
            exact: false
          },
          {
            path: '/admin/libros',
            label: 'Gestión de Libros',
            icon: BookOpen,
            exact: false
          },
          {
            path: '/loans',
            label: 'Préstamos',
            icon: Calendar,
            exact: false
          }
        ];

      case 'user':
        return [
          {
            path: '/dashboard/user',
            label: 'Catálogo de Libros',
            icon: BookOpen,
            exact: true
          },
          {
            path: '/mis-prestamos',
            label: 'Mis Préstamos',
            icon: Calendar
          }
        ];

      default:
        return [
          {
            path: '/dashboard/user',
            label: 'Inicio',
            icon: LayoutDashboard,
            exact: true
          }
        ];
    }
  };

  const menuItems = getMenuItems();

  // Comunicar estado de colapso al componente padre
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // Función para toggle de submenús
  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  // Función para verificar si un item está activo
  const isActive = (item: MenuItem): boolean => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  // Función para renderizar un item del menú
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const active = isActive(item);

    return (
      <div key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            active
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          } ${level > 0 ? 'ml-' + (level * 4) : ''}`}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.path);
            } else {
              // Cerrar sidebar en móvil al hacer clic en un enlace
              if (onClose) {
                onClose();
              }
            }
          }}
        >
          <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-2" />
                )
              )}
            </>
          )}
        </Link>
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return null;
  }

  // Función para obtener el rol formateado
  const getFormattedRole = () => {
    if (!user) return '';
    
    switch (user.role) {
      case 'superadmin':
        return 'MSuperAdmin';
      case 'admin':
        return 'SuperAdmin';
      case 'user':
        return 'Usuario';
      default:
        return user.role;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      
      {/* User Info con botón de cerrar */}
      <div className="p-4 border-b border-gray-200">
        {/* Botón de colapso siempre accesible */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-gray-500" />
            ) : (
              <X className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
              </div>
            </div>
            <div className="ml-13">
              <p className="text-xs font-semibold text-blue-600">{getFormattedRole()}</p>
              <p className="text-xs text-gray-500">@{user.username}</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => logout()}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
