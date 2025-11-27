import type { Permission, Role, UserPermissions, PermissionFormData, RoleFormData, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Función helper para hacer peticiones autenticadas
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token');

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ========== PERMISOS ==========

// Obtener todos los permisos
export const getPermissions = async (): Promise<ApiResponse<Permission[]>> => {
  return apiRequest<ApiResponse<Permission[]>>('/permissions');
};

// Crear un nuevo permiso
export const createPermission = async (permissionData: PermissionFormData): Promise<ApiResponse<Permission>> => {
  return apiRequest<ApiResponse<Permission>>('/permissions', {
    method: 'POST',
    body: JSON.stringify(permissionData),
  });
};

// Actualizar un permiso
export const updatePermission = async (id: string, permissionData: Partial<PermissionFormData>): Promise<ApiResponse<Permission>> => {
  return apiRequest<ApiResponse<Permission>>(`/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(permissionData),
  });
};

// Eliminar un permiso
export const deletePermission = async (id: string): Promise<ApiResponse<void>> => {
  return apiRequest<ApiResponse<void>>(`/permissions/${id}`, {
    method: 'DELETE',
  });
};

// ========== ROLES ==========

// Obtener todos los roles
export const getRoles = async (): Promise<ApiResponse<Role[]>> => {
  return apiRequest<ApiResponse<Role[]>>('/permissions/roles');
};

// Crear un nuevo rol
export const createRole = async (roleData: RoleFormData): Promise<ApiResponse<Role>> => {
  return apiRequest<ApiResponse<Role>>('/permissions/roles', {
    method: 'POST',
    body: JSON.stringify(roleData),
  });
};

// Actualizar un rol
export const updateRole = async (id: string, roleData: Partial<RoleFormData>): Promise<ApiResponse<Role>> => {
  return apiRequest<ApiResponse<Role>>(`/permissions/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(roleData),
  });
};

// Eliminar un rol
export const deleteRole = async (id: string): Promise<ApiResponse<void>> => {
  return apiRequest<ApiResponse<void>>(`/permissions/roles/${id}`, {
    method: 'DELETE',
  });
};

// ========== PERMISOS DE USUARIO ==========

// Obtener permisos de un usuario específico
export const getUserPermissions = async (userId: string): Promise<ApiResponse<UserPermissions>> => {
  return apiRequest<ApiResponse<UserPermissions>>(`/permissions/user/${userId}`);
};

// Verificar si un usuario tiene un permiso específico
export const checkPermission = async (userId?: string, permission?: string): Promise<ApiResponse<{ hasPermission: boolean }>> => {
  return apiRequest<ApiResponse<{ hasPermission: boolean }>>('/permissions/check', {
    method: 'POST',
    body: JSON.stringify({ userId, permission }),
  });
};
