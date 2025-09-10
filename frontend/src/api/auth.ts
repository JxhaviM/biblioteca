// Configuración base de la API
const API_BASE_URL = 'http://localhost:5000/api';

// Función helper para hacer requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  console.log('=== 🌐 API REQUEST START ===');
  console.log('🌐 URL:', url);
  console.log('🌐 Token available:', token ? 'yes' : 'no');
  console.log('🌐 Method:', options.method || 'GET');
  console.log('🌐 Body:', options.body);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log('🌐 Authorization header:', (config.headers as Record<string, string>)?.['Authorization'] ? 'included' : 'missing');
  console.log('🌐 Full config:', config);

  try {
    const response = await fetch(url, config);
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers);
    console.log('📊 Response ok:', response.ok);
    
    let data;
    try {
      data = await response.json();
      console.log('📊 Response data:', data);
    } catch (jsonError) {
      console.error('📊 Error parsing JSON:', jsonError);
      console.log('📊 Raw response text:', await response.text());
      throw new Error('Invalid JSON response from server');
    }
    
    if (!response.ok) {
      console.error('📊 Request failed with status:', response.status);
      console.error('📊 Error data:', data);
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    console.log('=== ✅ API REQUEST SUCCESS ===');
    return data;
  } catch (error) {
    console.error('=== ❌ API REQUEST FAILED ===');
    console.error('📊 API Request failed:', error);
    console.error('📊 Error type:', typeof error);
    console.error('📊 Error details:', error);
    throw error;
  }
};

// Tipos para el nuevo sistema de autenticación
export interface Person {
  id: string;
  doc: string;
  tipoDoc: 'CC' | 'TI' | 'CE' | 'Pasaporte';
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  genero: 'M' | 'F' | 'Otro';
  tipoPersona: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  grado?: string;
  grupo?: string;
  estado: 'Activo' | 'Suspendido' | 'Vetado';
  tieneCuenta: boolean;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nombre?: string; // Nombre completo calculado
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
  tieneCuenta: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    user: User;
    person: Person;
  };
  // Estructura alternativa (por si el backend devuelve directamente)
  user?: User;
  person?: Person;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreatePersonData {
  doc: string;
  tipoDoc: string;
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  genero: string;
  tipoPersona: string;
  grado?: string;
  grupo?: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface CreateAdminData {
  doc: string;
  tipoDoc: string;
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  genero: string;
  username: string;
  password: string;
  email?: string;
  telefono?: string;
}

export interface SearchFilters {
  tipoPersona?: string;
  grado?: string;
  grupo?: string;
  estado?: string;
  tieneCuenta?: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

export interface ReservationData {
  espacioId: string;
  fechaInicio: string;
  fechaFin: string;
  proposito: string;
  numeroPersonas: number;
  equipoRequerido?: string[];
}

export interface AvailabilityParams {
  espacioId?: string;
  fechaInicio: string;
  fechaFin: string;
}

// Funciones de autenticación
export const authAPI = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      console.log('Login response:', response); // Para debug
      
      if (response.success) {
        // Verificar la estructura de la respuesta
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        
        // Verificar si tiene la estructura con data
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          if (response.data.person) {
            localStorage.setItem('person', JSON.stringify(response.data.person));
          }
        } 
        // O si tiene la estructura directa
        else if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          if (response.person) {
            localStorage.setItem('person', JSON.stringify(response.person));
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('person');
  },

  // Obtener información del usuario actual
  getMe: async () => {
    return await apiRequest('/auth/me');
  },

  // Verificar si hay token válido
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obtener usuario del localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Obtener persona del localStorage
  getCurrentPerson: (): Person | null => {
    const personStr = localStorage.getItem('person');
    return personStr ? JSON.parse(personStr) : null;
  },

  // Crear superadmin
  createSuperAdmin: async (data: CreateAdminData) => {
    return await apiRequest('/auth/create-superadmin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Crear admin (solo superadmin)
  createAdmin: async (data: CreateAdminData) => {
    return await apiRequest('/auth/create-admin-with-person', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Crear usuarios por grado (solo admin/superadmin)
  createUsersByGrade: async (data: { grado: string; grupo?: string }) => {
    return await apiRequest('/auth/create-users-by-grade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// API para personas
export const personsAPI = {
  // Obtener todas las personas
  getPersons: async (params?: QueryParams) => {
    if (!params) return await apiRequest('/persons');
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/persons?${searchParams.toString()}`);
  },

  // Obtener persona por ID
  getPersonById: async (id: string) => {
    return await apiRequest(`/persons/${id}`);
  },

  // Crear persona
  createPerson: async (data: CreatePersonData) => {
    return await apiRequest('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Crear personas en lote
  createPersonsBulk: async (data: { persons: CreatePersonData[]; tipoPersona: string }) => {
    return await apiRequest('/persons/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar persona
  updatePerson: async (id: string, data: Partial<CreatePersonData>) => {
    return await apiRequest(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Cambiar estado de persona
  changePersonStatus: async (id: string, data: { estado: string; motivoEstado?: string }) => {
    return await apiRequest(`/persons/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Buscar personas
  searchPersons: async (query: string, filters?: SearchFilters) => {
    const searchParams = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return await apiRequest(`/persons/search?${searchParams.toString()}`);
  },

  // Obtener estadísticas
  getStats: async () => {
    return await apiRequest('/persons/stats');
  },

  // Obtener personas por grado
  getPersonsByGrade: async (grado: string, grupo?: string) => {
    const params = new URLSearchParams({ ...(grupo && { grupo }) });
    return await apiRequest(`/persons/by-grade/${grado}?${params.toString()}`);
  },
};

// API para asistencia
export const attendanceAPI = {
  // Check-in
  checkIn: async (data: { personId: string; tipoVisita?: string; observaciones?: string }) => {
    return await apiRequest('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Check-out
  checkOut: async (data: { personId?: string; attendanceId?: string; observacionesSalida?: string }) => {
    return await apiRequest('/attendance/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Obtener asistencias del día
  getTodayAttendances: async (activeOnly?: boolean) => {
    const params = activeOnly ? '?activeOnly=true' : '';
    return await apiRequest(`/attendance/today${params}`);
  },

  // Obtener asistencias activas
  getActiveAttendances: async () => {
    return await apiRequest('/attendance/active');
  },

  // Obtener historial
  getHistory: async (params?: QueryParams) => {
    if (!params) return await apiRequest('/attendance/history');
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/attendance/history?${searchParams.toString()}`);
  },

  // Obtener estadísticas
  getStats: async (params?: QueryParams) => {
    if (!params) return await apiRequest('/attendance/stats');
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/attendance/stats?${searchParams.toString()}`);
  },
};

// API para espacios
export const spacesAPI = {
  // Crear reserva
  createReservation: async (data: ReservationData) => {
    return await apiRequest('/spaces/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Obtener mis reservas
  getMyReservations: async (params?: QueryParams) => {
    if (!params) return await apiRequest('/spaces/my-reservations');
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/spaces/my-reservations?${searchParams.toString()}`);
  },

  // Obtener todas las reservas (admin)
  getAllReservations: async (params?: QueryParams) => {
    if (!params) return await apiRequest('/spaces/reservations');
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/spaces/reservations?${searchParams.toString()}`);
  },

  // Actualizar estado de reserva
  updateReservationStatus: async (id: string, data: { estado: string; observacionesAdmin?: string }) => {
    return await apiRequest(`/spaces/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Cancelar reserva
  cancelReservation: async (id: string) => {
    return await apiRequest(`/spaces/reservations/${id}`, {
      method: 'DELETE',
    });
  },

  // Verificar disponibilidad
  checkAvailability: async (params: AvailabilityParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/spaces/availability?${searchParams.toString()}`);
  },

  // Obtener estadísticas
  getStats: async (params?: QueryParams) => {
    if (!params) return await apiRequest('/spaces/stats');
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return await apiRequest(`/spaces/stats?${searchParams.toString()}`);
  },
};

export default apiRequest;
