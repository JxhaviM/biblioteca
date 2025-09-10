import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { personsAPI, attendanceAPI, spacesAPI, authAPI } from '../api/auth';
import CreateUserModal from '../components/CreateUserModal';
import CreatePersonModal from '../components/CreatePersonModal';
import type { User, Person } from '../api/auth';

interface DashboardStats {
  persons: {
    total: number;
    activos: number;
    estudiantes: number;
    profesores: number;
    colaboradores: number;
    conCuenta: number;
  };
  attendance: {
    totalVisitas: number;
    visitasActivas: number;
    visitasFinalizadas: number;
  };
  spaces: {
    totalReservas: number;
    pendientes: number;
    aprobadas: number;
  };
}

interface EstadoItem {
  estado: string;
  cantidad: number;
}

const SuperAdminDashboard: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showCreatePerson, setShowCreatePerson] = useState(false);

  useEffect(() => {
    console.log('👑 SuperAdminDashboard - Path actual:', location.pathname);
    console.log('👑 SuperAdminDashboard - Información completa de location:', location);
  }, [location]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar que hay autenticación antes de cargar datos
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔍 Debug auth state:');
      console.log('- Token in localStorage:', token ? 'exists' : 'missing');
      console.log('- User in localStorage:', user ? 'exists' : 'missing');
      
      if (!token) {
        setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Cargar datos del usuario
      const currentUser = authAPI.getCurrentUser();
      const currentPerson = authAPI.getCurrentPerson();
      
      if (!currentUser) {
        setError('No se encontraron datos del usuario. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setPerson(currentPerson);

      // Cargar estadísticas solo si tenemos autenticación válida
      console.log('Cargando estadísticas con token:', token ? 'disponible' : 'no disponible');
      
      const [personsStats, attendanceStats, spacesStats] = await Promise.all([
        personsAPI.getStats(),
        attendanceAPI.getStats(),
        spacesAPI.getStats()
      ]);

      console.log('Estadísticas cargadas:', { personsStats, attendanceStats, spacesStats });

      setStats({
        persons: personsStats.data || {},
        attendance: attendanceStats.data?.resumen || {},
        spaces: {
          totalReservas: spacesStats.data?.porEstado?.reduce((acc: number, item: EstadoItem) => acc + item.cantidad, 0) || 0,
          pendientes: spacesStats.data?.porEstado?.find((item: EstadoItem) => item.estado === 'Pendiente')?.cantidad || 0,
          aprobadas: spacesStats.data?.porEstado?.find((item: EstadoItem) => item.estado === 'Aprobada')?.cantidad || 0,
        }
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de crear usuario
  const handleOpenCreateAdmin = () => {
    setShowCreateAdmin(true);
  };

  // Función para manejar el éxito al crear persona
  const handleCreatePersonSuccess = (message: string) => {
    setShowCreatePerson(false);
    // Recargar estadísticas para reflejar la nueva persona
    loadDashboardData();
    // Opcional: mostrar notificación de éxito
    console.log('Persona creada exitosamente:', message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                Dashboard SuperAdmin
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Bienvenido, {person ? `${person.nombre1} ${person.apellido1}` : user?.username}
              </p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                🔑 SuperAdministrador
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total de Personas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Personas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.persons.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">
                  {stats?.persons.activos || 0} activos
                </span>
                <span className="text-gray-500"> • </span>
                <span className="text-blue-600 font-medium">
                  {stats?.persons.conCuenta || 0} con cuenta
                </span>
              </div>
            </div>
          </div>

          {/* Estudiantes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🎓</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Estudiantes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.persons.estudiantes || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">
                  {stats?.persons.profesores || 0} profesores
                </span>
                <span className="text-gray-500"> • </span>
                <span className="text-purple-600 font-medium">
                  {stats?.persons.colaboradores || 0} colaboradores
                </span>
              </div>
            </div>
          </div>

          {/* Asistencia Hoy */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Asistencia Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.attendance.totalVisitas || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">
                  {stats?.attendance.visitasActivas || 0} activas
                </span>
                <span className="text-gray-500"> • </span>
                <span className="text-gray-600 font-medium">
                  {stats?.attendance.visitasFinalizadas || 0} finalizadas
                </span>
              </div>
            </div>
          </div>

          {/* Reservas de Espacios */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Reservas de Espacios
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.spaces.totalReservas || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-yellow-600 font-medium">
                  {stats?.spaces.pendientes || 0} pendientes
                </span>
                <span className="text-gray-500"> • </span>
                <span className="text-green-600 font-medium">
                  {stats?.spaces.aprobadas || 0} aprobadas
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Gestión de Usuarios */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                👥 Gestión de Usuarios
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={handleOpenCreateAdmin}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-md transition-colors"
                >
                  <div className="font-medium text-blue-900">Crear Usuario</div>
                  <div className="text-sm text-blue-700">Crear usuario con cualquier rol</div>
                </button>
                <button className="w-full text-left bg-green-50 hover:bg-green-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-green-900">Crear Usuarios por Grado</div>
                  <div className="text-sm text-green-700">Crear cuentas masivamente por curso</div>
                </button>
                <button className="w-full text-left bg-purple-50 hover:bg-purple-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-purple-900">Gestionar Permisos</div>
                  <div className="text-sm text-purple-700">Administrar roles y permisos</div>
                </button>
              </div>
            </div>
          </div>

          {/* Gestión de Personas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                👤 Gestión de Personas
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowCreatePerson(true)}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-md transition-colors"
                >
                  <div className="font-medium text-blue-900">Registrar Persona</div>
                  <div className="text-sm text-blue-700">Agregar nueva persona al sistema</div>
                </button>
                <button className="w-full text-left bg-green-50 hover:bg-green-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-green-900">Carga Masiva</div>
                  <div className="text-sm text-green-700">Importar múltiples personas</div>
                </button>
                <button className="w-full text-left bg-orange-50 hover:bg-orange-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-orange-900">Gestionar Estados</div>
                  <div className="text-sm text-orange-700">Activar, suspender o vetar personas</div>
                </button>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                ⚙️ Configuración del Sistema
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left bg-red-50 hover:bg-red-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-red-900">Backup de Base de Datos</div>
                  <div className="text-sm text-red-700">Crear respaldo del sistema</div>
                </button>
                <button className="w-full text-left bg-yellow-50 hover:bg-yellow-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-yellow-900">Logs del Sistema</div>
                  <div className="text-sm text-yellow-700">Revisar actividad del sistema</div>
                </button>
                <button className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors">
                  <div className="font-medium text-gray-900">Configuración Global</div>
                  <div className="text-sm text-gray-700">Ajustes generales del sistema</div>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Actividad Reciente */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              📊 Resumen del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Estado del Sistema */}
              <div className="text-center">
                <div className="text-3xl mb-2">🟢</div>
                <h4 className="font-medium text-gray-900">Sistema Operativo</h4>
                <p className="text-sm text-gray-500">Todos los servicios funcionando correctamente</p>
              </div>

              {/* Base de Datos */}
              <div className="text-center">
                <div className="text-3xl mb-2">💾</div>
                <h4 className="font-medium text-gray-900">Base de Datos</h4>
                <p className="text-sm text-gray-500">Conectada y sincronizada</p>
              </div>

              {/* Último Backup */}
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="font-medium text-gray-900">Seguridad</h4>
                <p className="text-sm text-gray-500">Sistema seguro y actualizado</p>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Modal para crear usuario */}
      <CreateUserModal
        isOpen={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        onSuccess={(message) => {
          console.log('Usuario creado:', message);
          // Opcional: recargar datos si es necesario
        }}
        currentUserRole="superadmin"
        isMasterSuperAdmin={true} // Por ahora asumimos que es master, luego podemos hacer esto dinámico
      />

      {/* Modal para crear persona */}
      <CreatePersonModal
        isOpen={showCreatePerson}
        onClose={() => setShowCreatePerson(false)}
        onSuccess={handleCreatePersonSuccess}
      />
    </div>
  );
};

export default SuperAdminDashboard;
