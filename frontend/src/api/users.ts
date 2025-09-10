import type { User, Person, UserUpdateData, AuditEntry, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

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

// Obtener todos los usuarios (con datos de persona)
export const getUsers = async (): Promise<ApiResponse<(User & { person: Person })[]>> => {
  return apiRequest<ApiResponse<(User & { person: Person })[]>>('/users');
};

// Obtener un usuario específico
export const getUser = async (userId: string): Promise<ApiResponse<User & { person: Person }>> => {
  return apiRequest<ApiResponse<User & { person: Person }>>(`/users/${userId}`);
};

// Actualizar usuario/persona
export const updateUser = async (userId: string, updates: UserUpdateData): Promise<ApiResponse<User & { person: Person }>> => {
  return apiRequest<ApiResponse<User & { person: Person }>>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Obtener historial de auditoría de un usuario
export const getUserAudit = async (userId: string, limit = 50): Promise<ApiResponse<AuditEntry[]>> => {
  return apiRequest<ApiResponse<AuditEntry[]>>(`/users/${userId}/audit?limit=${limit}`);
};

// Resetear contraseña de otro usuario (Admin/SuperAdmin) - Nueva ruta desde auth
export const resetUserPassword = async (userId: string): Promise<ApiResponse<{ newPassword: string; user: Partial<User>; resetBy: string }>> => {
  return apiRequest<ApiResponse<{ newPassword: string; user: Partial<User>; resetBy: string }>>(`/auth/reset-password/${userId}`, {
    method: 'PUT',
  });
};

// Cambiar contraseña propia
export const changeOwnPassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<{ username: string; changedAt: string }>> => {
  return apiRequest<ApiResponse<{ username: string; changedAt: string }>>('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
};

// Crear usuario universal (con selector de rol)
export const createUser = async (userData: {
  personId: string;
  role: 'user' | 'admin' | 'superadmin';
  customUsername?: string;
}): Promise<ApiResponse<{ user: User; person: Person; credentials: { username: string; password: string; role: string } }>> => {
  return apiRequest<ApiResponse<{ user: User; person: Person; credentials: { username: string; password: string; role: string } }>>('/auth/create-user', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Crear usuario con datos completos de persona
export const createUserWithPerson = async (userData: {
  // Datos del usuario
  username: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin';
  
  // Datos de la persona
  doc: string;
  tipoDoc?: 'CC' | 'NES' | 'PPT' | 'RC' | 'TI';
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2?: string;
  genero?: 'Masculino' | 'Femenino';
  fechaNacimiento?: string;
  direccion?: string;
  celular?: string;
  email?: string;
  tipoPersona?: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  
  // Campos específicos para estudiantes
  grado?: string;
  grupo?: string;
  
  // Campos específicos para profesores
  nivelEducativo?: 'Transición' | 'Primaria' | 'Secundaria' | 'General';
  materias?: string[];
  
  observaciones?: string;
}): Promise<ApiResponse<{ user: User; person: Person; credentials: { username: string; password: string; role: string } }>> => {
  return apiRequest<ApiResponse<{ user: User; person: Person; credentials: { username: string; password: string; role: string } }>>('/auth/create-user-with-person', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Obtener auditoría completa del sistema (solo SuperAdmin)
export const getSystemAudit = async (limit = 100, startDate?: string, endDate?: string): Promise<ApiResponse<AuditEntry[]>> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  return apiRequest<ApiResponse<AuditEntry[]>>(`/users/audit/system?${params.toString()}`);
};

// Soft delete de usuario
export const deleteUser = async (userId: string): Promise<ApiResponse<{ user: Partial<User> }>> => {
  return apiRequest<ApiResponse<{ user: Partial<User> }>>(`/users/${userId}`, {
    method: 'DELETE',
  });
};

// Restaurar usuario
export const restoreUser = async (userId: string): Promise<ApiResponse<{ user: Partial<User> }>> => {
  return apiRequest<ApiResponse<{ user: Partial<User> }>>(`/users/${userId}/restore`, {
    method: 'POST',
  });
};
