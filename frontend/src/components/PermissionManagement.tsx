import React, { useState, useEffect } from 'react';
import { getPermissions, getRoles, createPermission, updatePermission, deletePermission, createRole, updateRole, deleteRole } from '../api/permissions';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import type { Permission, Role } from '../types';

interface PermissionManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionManagement: React.FC<PermissionManagementProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'permissions' | 'roles'>('permissions');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);

  const { showError, showSuccess, showApiError } = useNotificationHelpers();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'permissions') {
        const response = await getPermissions();
        if (response.success) {
          setPermissions(response.data || []);
        } else {
          showError('Error', response.message || 'Error al cargar permisos');
        }
      } else {
        const response = await getRoles();
        if (response.success) {
          setRoles(response.data || []);
        } else {
          showError('Error', response.message || 'Error al cargar roles');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showApiError(error, `Error al cargar ${activeTab === 'permissions' ? 'permisos' : 'roles'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (permissionData: any) => {
    try {
      const response = await createPermission(permissionData);
      if (response.success) {
        showSuccess('Permiso Creado', response.message || 'Permiso creado exitosamente');
        setShowCreatePermission(false);
        loadData();
      }
    } catch (error) {
      showApiError(error, 'Error al crear permiso');
    }
  };

  const handleCreateRole = async (roleData: any) => {
    try {
      const response = await createRole(roleData);
      if (response.success) {
        showSuccess('Rol Creado', response.message || 'Rol creado exitosamente');
        setShowCreateRole(false);
        loadData();
      }
    } catch (error) {
      showApiError(error, 'Error al crear rol');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Gestión de Permisos</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'permissions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Permisos
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Roles
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'permissions' ? (
            <PermissionsTab
              permissions={permissions}
              loading={loading}
              onCreate={() => setShowCreatePermission(true)}
              onUpdate={updatePermission}
              onDelete={deletePermission}
              onRefresh={loadData}
            />
          ) : (
            <RolesTab
              roles={roles}
              permissions={permissions}
              loading={loading}
              onCreate={() => setShowCreateRole(true)}
              onUpdate={updateRole}
              onDelete={deleteRole}
              onRefresh={loadData}
            />
          )}
        </div>

        {/* Create Permission Modal */}
        {showCreatePermission && (
          <CreatePermissionModal
            onSubmit={handleCreatePermission}
            onClose={() => setShowCreatePermission(false)}
            availablePermissions={[]} // Para permisos individuales
          />
        )}

        {/* Create Role Modal */}
        {showCreateRole && (
          <CreateRoleModal
            onSubmit={handleCreateRole}
            onClose={() => setShowCreateRole(false)}
            availablePermissions={permissions}
          />
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de permisos
const PermissionsTab: React.FC<{
  permissions: Permission[];
  loading: boolean;
  onCreate: () => void;
  onUpdate: (id: string, data: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onRefresh: () => void;
}> = ({ permissions, loading, onCreate, onUpdate, onDelete, onRefresh }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">Permisos del Sistema</h4>
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Crear Permiso
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando permisos...</div>
      ) : (
        <div className="grid gap-4">
          {permissions.map((permission) => (
            <div key={permission._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{permission.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {permission.resource}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {permission.action}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      permission.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {permission.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Editar</button>
                  <button className="text-red-600 hover:text-red-800">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para la pestaña de roles
const RolesTab: React.FC<{
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  onCreate: () => void;
  onUpdate: (id: string, data: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onRefresh: () => void;
}> = ({ roles, permissions, loading, onCreate, onUpdate, onDelete, onRefresh }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">Roles del Sistema</h4>
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Crear Rol
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando roles...</div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <div key={role._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-medium text-gray-900">{role.displayName}</h5>
                    {role.isSystem && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Sistema
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Nivel: {role.level}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.permissions?.slice(0, 3).map((permission) => (
                      <span key={permission._id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {permission.name}
                      </span>
                    ))}
                    {role.permissions && role.permissions.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{role.permissions.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Editar</button>
                  {!role.isSystem && (
                    <button className="text-red-600 hover:text-red-800">Eliminar</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Modal para crear permiso
const CreatePermissionModal: React.FC<{
  onSubmit: (data: any) => void;
  onClose: () => void;
  availablePermissions: Permission[];
}> = ({ onSubmit, onClose, availablePermissions }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: 'users' as Permission['resource'],
    action: 'read' as Permission['action'],
    scope: 'own' as Permission['scope']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h4 className="text-lg font-semibold mb-4">Crear Permiso</h4>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Permiso
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurso
              </label>
              <select
                value={formData.resource}
                onChange={(e) => setFormData({...formData, resource: e.target.value as Permission['resource']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="users">Usuarios</option>
                <option value="persons">Personas</option>
                <option value="books">Libros</option>
                <option value="loans">Préstamos</option>
                <option value="attendance">Asistencia</option>
                <option value="spaces">Espacios</option>
                <option value="reports">Reportes</option>
                <option value="audit">Auditoría</option>
                <option value="system">Sistema</option>
                <option value="permissions">Permisos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acción
              </label>
              <select
                value={formData.action}
                onChange={(e) => setFormData({...formData, action: e.target.value as Permission['action']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="create">Crear</option>
                <option value="read">Leer</option>
                <option value="update">Actualizar</option>
                <option value="delete">Eliminar</option>
                <option value="manage">Gestionar</option>
                <option value="export">Exportar</option>
                <option value="import">Importar</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para crear rol
const CreateRoleModal: React.FC<{
  onSubmit: (data: any) => void;
  onClose: () => void;
  availablePermissions: Permission[];
}> = ({ onSubmit, onClose, availablePermissions }) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
    level: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <h4 className="text-lg font-semibold mb-4">Crear Rol</h4>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Rol
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre para Mostrar
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Acceso
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permisos
              </label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3">
                {availablePermissions.map((permission) => (
                  <label key={permission._id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission._id)}
                      onChange={() => togglePermission(permission._id)}
                      className="rounded"
                    />
                    <span className="text-sm">{permission.name}</span>
                    <span className="text-xs text-gray-500">({permission.resource})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Crear Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionManagement;
