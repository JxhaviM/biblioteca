// Configuración base de la API
const API_BASE_URL = 'http://localhost:5000/api';

// Función helper para hacer requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
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
  token: string;
  data: {
    user: User;
    person: Person;
  };
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
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface LoginData {
  email: string;
  password: string;
}

// Servicios de autenticación
export const authApi = {
  // Registrar usuario
  register: (userData: RegisterData): Promise<LoginResponse> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Iniciar sesión
  login: (credentials: LoginData): Promise<LoginResponse> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Verificar token (si implementas verificación)
  verifyToken: (token: string) =>
    apiRequest('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

// Utilidades para manejar tokens
export const tokenUtils = {
  // Guardar token en localStorage
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  // Obtener token del localStorage
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Eliminar token
  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  // Verificar si hay token
  hasToken: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
};