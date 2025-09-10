import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dashboardApi, type DashboardStats } from '../api';

interface HomePageProps {
  onLogout?: () => void;
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
const HomePage = ({ onLogout }: HomePageProps) => {
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🏡 HomePage - Path actual:', location.pathname);
    console.log('🏡 HomePage - Información completa de location:', location);
  }, [location]);

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getStats();
        
        if (response.success) {
          setStats(response.dashboard);
        } else {
          setError('Error al cargar estadísticas');
        }
      } catch (err) {
        setError('Error de conexión con el servidor');
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Cargando Dashboard</h2>
            <p className="text-gray-600">Obteniendo datos del sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header moderno */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sistema Biblioteca
              </h1>
              <p className="text-gray-600 font-medium">Panel de control administrativo</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl">
                <span className="text-3xl">📊</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center space-x-2"
                >
                  <span>🚪</span>
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Estadísticas principales con gradientes únicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Libros Registrados"
            value={stats?.totalBooks || 0}
            icon="📚"
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Estudiantes Activos"
            value={stats?.totalStudents || 0}
            icon="👥"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Préstamos Vigentes"
            value={stats?.activeLoans || 0}
            icon="�"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            trend={{ value: 5, isPositive: false }}
          />
          <StatCard
            title="Disponibles"
            value={stats?.availableBooks || 0}
            icon="✨"
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Alerta de préstamos atrasados rediseñada */}
        {stats && stats.overdueLoans > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-1 shadow-xl">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {stats.overdueLoans} Préstamos Atrasados
                  </h3>
                  <p className="text-gray-600 font-medium">
                    Requieren seguimiento inmediato para su resolución
                  </p>
                </div>
                <button className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección principal con géneros y actividad */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Géneros populares rediseñado */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
                <h3 className="text-xl font-bold text-white">Géneros Favoritos</h3>
              </div>
              <div className="p-6">
                {stats?.popularGenres?.length ? (
                  <div className="space-y-4">
                    {stats.popularGenres.slice(0, 5).map((genre, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-emerald-50 hover:to-teal-50 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-semibold text-gray-900">{genre}</span>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                            style={{ width: `${100 - (index * 15)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-500 font-medium">Sin datos de géneros</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="xl:col-span-2">
            <ActivityFeed activities={stats?.recentActivity || []} />
          </div>
        </div>

        {/* Acciones rápidas rediseñadas */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="group bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
              <div className="text-center space-y-4">
                <div className="text-5xl group-hover:scale-110 transition-transform">📚</div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Gestionar Libros</h4>
                  <p className="text-blue-100">Agregar, editar o buscar libros</p>
                </div>
              </div>
            </button>
            
            <button className="group bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
              <div className="text-center space-y-4">
                <div className="text-5xl group-hover:scale-110 transition-transform">👥</div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Estudiantes</h4>
                  <p className="text-emerald-100">Administrar usuarios del sistema</p>
                </div>
              </div>
            </button>
            
            <button className="group bg-gradient-to-br from-purple-500 to-pink-600 text-white p-8 rounded-2xl hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
              <div className="text-center space-y-4">
                <div className="text-5xl group-hover:scale-110 transition-transform">📝</div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Nuevo Préstamo</h4>
                  <p className="text-purple-100">Registrar préstamo de libro</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;