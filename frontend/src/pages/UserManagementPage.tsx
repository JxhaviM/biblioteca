import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../api/auth';
import type { Person, UserUpdateData } from '../types';
import EditUserModal from '../components/EditUserModal';
import { getUsers, updateUser, getUserAudit } from '../api/users';

interface UserManagementProps {
  currentUserRole: 'superadmin' | 'admin' | 'user';
}

interface UserWithDetails extends User {
  lastLogin?: string;
  createdBy?: string;
  updatedBy?: string;
  person?: Person;
}

const UserManagementPage: React.FC<UserManagementProps> = ({ currentUserRole }) => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Obtener el ID del usuario actual
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }
  }, []);

  const canCreateUsers = currentUserRole === 'superadmin' || currentUserRole === 'admin';
  const canEditUsers = currentUserRole === 'superadmin' || currentUserRole === 'admin';

  // Memoizar los roles manejables para evitar re-renderizado infinito
  const manageableRoles = useMemo(() => {
    switch (currentUserRole) {
      case 'superadmin':
        return ['user', 'admin', 'superadmin'];
      case 'admin':
        return ['user'];
      default:
        return [];
    }
  }, [currentUserRole]);

  // Cargar usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('http://localhost:5000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al cargar usuarios: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      // Verificar que la respuesta sea exitosa y tenga datos
      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        throw new Error('Respuesta de API inválida');
      }
      
      // Filtrar usuarios según el rol del usuario actual
      const filteredUsers = apiResponse.data.filter((user: UserWithDetails) => 
        manageableRoles.includes(user.role)
      );

      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [manageableRoles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Función para abrir el modal de edición
  const handleEditUser = async (user: UserWithDetails) => {
    try {
      const userId = getUserId(user);
      
      // Si el usuario ya tiene datos de persona, usar esos
      if (user.person) {
        setSelectedUser(user);
        setSelectedPerson(user.person);
        setShowEditModal(true);
        return;
      }
      
      // Si no tiene datos de persona, cargarlos desde la API
      const response = await getUsers();
      if (response.success && response.data) {
        const userWithPerson = response.data.find(u => {
          const foundUserId = u._id;
          return foundUserId === userId;
        });
        
        if (userWithPerson && userWithPerson.person) {
          // Actualizar el usuario en la lista local con los datos de persona
          const updatedUser: UserWithDetails = {
            ...user,
            person: userWithPerson.person
          };
          
          setSelectedUser(updatedUser);
          setSelectedPerson(userWithPerson.person);
          setShowEditModal(true);
        } else {
          alert('No se pudieron cargar los datos de la persona');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      alert('Error al cargar los datos del usuario');
    }
  };

  // Función para guardar cambios del usuario
  const handleSaveUser = async (updates: UserUpdateData) => {
    if (!selectedUser) return;
    
    try {
      const userId = getUserId(selectedUser);
      const response = await updateUser(userId, updates);
      
      if (response.success) {
        // Actualizar la lista de usuarios
        await fetchUsers();
        alert('Usuario actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error; // Re-lanzar para que el modal pueda manejarlo
    }
  };

  // Función para cerrar el modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setSelectedPerson(null);
  };

  // Función para obtener el ID real del usuario (puede ser _id o id)
  const getUserId = (user: UserWithDetails & { _id?: string }) => {
    return user.id || user._id || '';
  };

  // Función para verificar si un usuario es el usuario actual
  const isCurrentUser = (userId: string) => {
    const isMatch = currentUserId && currentUserId === userId;
    return isMatch;
  };

  // Función para determinar si se pueden mostrar las acciones para un usuario
  const canPerformActionsOnUser = (user: UserWithDetails & { _id?: string }) => {
    const userId = getUserId(user);
    // No se puede modificar a uno mismo
    if (isCurrentUser(userId)) {
      return false;
    }
    
    // Superadmin puede modificar a todos excepto a sí mismo
    if (currentUserRole === 'superadmin') {
      return true;
    }
    
    // Admin solo puede modificar usuarios regulares, no otros admins o superadmins
    if (currentUserRole === 'admin') {
      return user.role === 'user';
    }
    
    return false;
  };

  // Filtrar usuarios según la búsqueda y filtros
  const filteredUsers = users.filter(user => {
    const userId = getUserId(user);
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Función para cambiar el estado de un usuario
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (currentStatus) {
        // Si está activo y lo queremos desactivar, usar soft delete
        if (!confirm('¿Estás seguro de que quieres desactivar este usuario? El usuario será marcado como inactivo pero se preservará su historial.')) {
          return;
        }
        
        response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Si está inactivo y lo queremos activar, usar restore
        response = await fetch(`http://localhost:5000/api/users/${userId}/restore`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        throw new Error('Error al cambiar estado del usuario');
      }

      // Actualizar la lista local
      setUsers(prev => prev.map(user => 
        getUserId(user) === userId ? { ...user, isActive: !currentStatus } : user
      ));
      
      alert(currentStatus ? 'Usuario desactivado exitosamente' : 'Usuario activado exitosamente');
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('Error al cambiar el estado del usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 mt-2">
                {currentUserRole === 'superadmin' 
                  ? 'Administra todos los usuarios del sistema'
                  : 'Administra usuarios con rol de usuario'
                }
              </p>
            </div>
            
            {canCreateUsers && (
              <button
                onClick={() => {
                  // TODO: Implementar modal de creación
                  alert('Función de crear usuario en desarrollo');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <span>➕</span>
                <span>Crear Usuario</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredUsers.filter(u => u.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredUsers.filter(u => !u.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            {currentUserRole === 'superadmin' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">🔑</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {filteredUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Usuario
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre de usuario o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Rol
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los roles</option>
                {manageableRoles.map((role: string) => (
                  <option key={role} value={role}>
                    {role === 'superadmin' ? 'Super Administrador' : 
                     role === 'admin' ? 'Administrador' : 'Usuario'}
                  </option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Conexión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => {
                  const userId = getUserId(user);
                  return (
                  <tr key={`user-${userId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {user.username}
                            {isCurrentUser(userId) && (
                              <span key={`current-user-badge-${userId}-${index}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Este eres tú
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'superadmin' && '🔑 '}
                        {user.role === 'admin' && '👨‍💼 '}
                        {user.role === 'user' && '👤 '}
                        {user.role === 'superadmin' ? 'Super Admin' : 
                         user.role === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {isCurrentUser(userId) ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 text-sm font-medium">
                            🏷️ Este es tu usuario
                          </span>
                          {/* Solo mostrar botón Editar para el usuario actual */}
                          {canEditUsers && (
                            <button
                              key={`edit-btn-${userId}-${index}`}
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Editar usuario"
                            >
                              ✏️ Editar
                            </button>
                          )}
                        </div>
                      ) : canPerformActionsOnUser(user) ? (
                        <div className="flex items-center space-x-2">
                          {/* Toggle Status */}
                          <button
                            key={`toggle-btn-${userId}-${index}`}
                            onClick={() => toggleUserStatus(userId, user.isActive)}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                              user.isActive 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {user.isActive ? '🔒 Desactivar' : '🔓 Activar'}
                          </button>

                          {/* Edit */}
                          {canEditUsers && (
                            <button
                              key={`edit-btn-${userId}-${index}`}
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Editar usuario"
                            >
                              ✏️ Editar
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          🔒 Sin permisos para modificar
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-gray-500">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Intenta ajustar tus filtros de búsqueda'
                    : 'No hay usuarios registrados en el sistema'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición de usuario */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        user={selectedUser}
        person={selectedPerson}
        onSave={handleSaveUser}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId || ''}
      />
    </div>
  );
};

export default UserManagementPage;
