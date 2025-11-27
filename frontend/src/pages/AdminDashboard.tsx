import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dashboardApi, type DashboardStats } from '../api';
import { getUserActivity } from '../api/system';
import CreateLoanModal from '../components/CreateLoanModal';
import { useUserContext } from '../contexts/UserContext';
import type { User, Person } from '../api/auth';

interface AdminDashboardProps {
  user?: User | null;
  person?: Person | null;
  currentUserRole?: 'superadmin' | 'admin';
}

// Componente para las tarjetas de estadísticas con diseño más único
const StatCard = ({ title, value, icon, gradient, trend }: {
  title: string;
  value: number | string;
  icon: string;
  gradient: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
    <div className={`absolute inset-0 ${gradient} opacity-5`}></div>
    <div className="relative p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-black text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${gradient} bg-opacity-10`}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  </div>
);

// Componente para actividad reciente con diseño más elegante
const ActivityFeed = ({ activities }: { activities: DashboardStats['recentActivity'] }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
      <h3 className="text-xl font-bold text-white">Actividad Reciente</h3>
    </div>
    
    <div className="p-6 max-h-96 overflow-y-auto">
      {activities?.length ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                activity.type === 'loan' 
                  ? 'bg-blue-100 text-blue-600' 
                  : activity.type === 'return' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <span className="text-lg font-semibold">
                  {activity.type === 'loan' ? '📚' : activity.type === 'return' ? '✅' : '👤'}
                </span>
              </div>
    
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {new Date(activity.timestamp).toLocaleString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
    
            </div>
    
          ))}
        </div>
    
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500 font-medium">No hay actividad registrada</p>
        </div>
    
      )}
    </div>
    
  </div>
);

// Componente principal del Dashboard
const AdminDashboard = ({ user, person, currentUserRole = 'admin' }: AdminDashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  
  // Función para navegar a la gestión de libros
  const handleManageBooks = () => {
    navigate('/adminbooks');
  };
  
  // Función para navegar a la gestión de usuarios
  const handleManageUsers = () => {
    navigate('/admin/usuarios');
  };
  
  // Función para navegar a la gestión de personas
  const handleManagePersons = () => {
    navigate('/admin/personas');
  };
  
  // Estado para controlar la visibilidad del modal de nuevo préstamo
  const [showCreateLoanModal, setShowCreateLoanModal] = useState(false);
  
  // Función para manejar el éxito del préstamo
  const handleLoanSuccess = () => {
    setShowCreateLoanModal(false);
    // Recargar estadísticas después de crear un préstamo
    loadDashboard();
  };
  
  // Función para abrir el modal de nuevo préstamo
  const handleNewLoan = () => {
    setShowCreateLoanModal(true);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getStats();
      // Asegurarnos de que la respuesta tenga el formato correcto
      if (response && response.success && response.dashboard) {
        setStats(response.dashboard);
      } else {
        throw new Error('Formato de respuesta inesperado');
      }
      setError(null);
    } catch (err) {
      console.error('Error al cargar el dashboard:', err);
      setError('Error al cargar las estadísticas del dashboard');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    try {
      const response = await getUserActivity({ limite: 20 });
      if (response && response.logs) {
        // Convertir logs a formato de actividad
        const activity = response.logs.map((log: any) => ({
          type: log.tipo === 'LOGIN' ? 'login' : 
                log.tipo === 'PRESTAMO' ? 'loan' : 
                log.tipo === 'DEVOLUCION' ? 'return' : 'activity',
          description: log.descripcion || log.accion,
          timestamp: log.createdAt
        }));
        setUserActivity(activity);
      }
    } catch (err) {
      console.error('Error al cargar actividad de usuarios:', err);
    }
  };

  useEffect(() => {
    console.log('🏡 AdminDashboard - Path actual:', location.pathname);
    console.log('🏡 AdminDashboard - Información completa de location:', location);
    loadDashboard();
    
    // Cargar actividad de usuarios si es Admin
    if (currentUserRole === 'admin') {
      loadUserActivity();
    }
  }, [currentUserRole]);

  if (loading) {
    return (
    
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 border-solid mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800">Cargando Dashboard</h2>
            <p className="text-gray-600">Obteniendo datos del sistema...</p>
          </div>
    
        </div>
    
      </div>
    
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div>
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
    
          </header>
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-6">
              <div className="text-8xl">🚫</div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-gray-900">¡Oops!</h2>
                <p className="text-gray-600 text-lg leading-relaxed">{error}</p>
              </div>
    
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Intentar de Nuevo
              </button>
            </div>
    
          </div>
    
        </div>
    
      </div>
    
    );
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Contenido principal */}
      <div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-gray-600">Bienvenido al sistema de gestión de la biblioteca</p>
              </div>
    
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl">
                <span className="text-3xl">📊</span>
              </div>
    
            </div>

            {/* Sección de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Libros"
                value={stats?.totalBooks || 0}
                icon="📚"
                gradient="from-blue-500 to-indigo-600"
              />
              <StatCard
                title="Usuarios"
                value={stats?.totalStudents || 0}
                icon="👥"
                gradient="from-emerald-500 to-teal-600"
              />
              <StatCard
                title="Préstamos"
                value={stats?.activeLoans || 0}
                icon="📝"
                gradient="from-amber-500 to-orange-600"
              />
              <StatCard
                title="Disponibles"
                value={stats?.availableBooks || 0}
                icon="✅"
                gradient="from-purple-500 to-pink-600"
              />
            </div>

            {/* Sección de acciones rápidas */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors hover:shadow-md hover:border-indigo-200"
                  onClick={handleManageBooks}
                >
                  <div className="text-2xl mb-2">📚</div>
                  <h3 className="font-medium">Gestionar Libros</h3>
                  <p className="text-sm text-gray-500">Agregar o editar libros</p>
                </button>
                
                <button 
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors hover:shadow-md hover:border-indigo-200"
                  onClick={handleManageUsers}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="font-medium">Gestionar Usuarios</h3>
                  <p className="text-sm text-gray-500">Administrar cuentas</p>
                </button>
                
                <button 
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors hover:shadow-md hover:border-indigo-200"
                  onClick={handleManagePersons}
                >
                  <div className="text-2xl mb-2">👤</div>
                  <h3 className="font-medium">Gestionar Personas</h3>
                  <p className="text-sm text-gray-500">Administrar personas</p>
                </button>
                
                <button 
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors hover:shadow-md hover:border-indigo-200"
                  onClick={handleNewLoan}
                >
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-medium">Nuevo Préstamo</h3>
                  <p className="text-sm text-gray-500">Registrar préstamo</p>
                </button>
              </div>
    
            </div>
    
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {currentUserRole === 'admin' ? 'Actividad de Usuarios' : 'Actividad Reciente'}
            </h2>
            <ActivityFeed activities={
              currentUserRole === 'admin' 
                ? userActivity 
                : stats?.recentActivity || []
            } />
          </div>
    
        </div>
    
      </div>

      {/* Modal de Nuevo Préstamo */}
      {showCreateLoanModal && (
        <CreateLoanModal 
          isOpen={showCreateLoanModal} 
          onClose={() => setShowCreateLoanModal(false)} 
          onSuccess={handleLoanSuccess}
        />
      )}
    </div>
    
  );
};

export default AdminDashboard;