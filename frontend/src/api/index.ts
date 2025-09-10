// Configuración base de la API
const API_BASE_URL = 'http://localhost:5000/api';

// Función helper para hacer requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Tipos para Dashboard
export interface DashboardStats {
  totalBooks: number;
  totalStudents: number;
  activeLoans: number;
  overdueLoans: number;
  availableBooks: number;
  popularGenres: string[];
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// Tipos para Estudiantes
export interface Student {
  _id: string;
  name: string;
  idNumber: string;
  grade: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos para Préstamos
export interface Loan {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: string;
  };
  student: {
    _id: string;
    name: string;
    idNumber: string;
  };
  copyNumber: number;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'prestado' | 'devuelto' | 'atrasado' | 'renovado' | 'perdido' | 'danado';
  renewalCount: number;
  loanType: 'normal' | 'extended' | 'special';
  notes?: string;
}

// Servicios del Dashboard/Reportes
export const dashboardApi = {
  // Obtener estadísticas del dashboard
  getStats: (): Promise<{ success: boolean; dashboard: DashboardStats }> =>
    apiRequest('/reports/dashboard'),

  // Health check
  healthCheck: () => apiRequest('/health'),
};

// Servicios de Estudiantes
export const studentsApi = {
  // Obtener todos los estudiantes
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    grade?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.grade) queryParams.append('grade', params.grade);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/students${queryString ? `?${queryString}` : ''}`);
  },

  // Obtener estudiante por ID
  getById: (id: string) => apiRequest(`/students/${id}`),

  // Obtener estadísticas de un estudiante
  getStats: (id: string) => apiRequest(`/students/${id}/stats`),

  // Obtener historial de préstamos
  getLoans: (id: string, params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/students/${id}/loans${queryString ? `?${queryString}` : ''}`);
  },

  // Crear estudiante
  create: (studentData: Omit<Student, '_id' | 'createdAt' | 'updatedAt' | 'isActive'>) =>
    apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  // Actualizar estudiante
  update: (id: string, studentData: Partial<Omit<Student, '_id' | 'createdAt' | 'updatedAt'>>) =>
    apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    }),

  // Eliminar estudiante
  delete: (id: string) => apiRequest(`/students/${id}`, { method: 'DELETE' }),
};

// Servicios de Préstamos
export const loansApi = {
  // Obtener historial de préstamos
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    bookId?: string;
    studentId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return apiRequest(`/loans${queryString ? `?${queryString}` : ''}`);
  },

  // Obtener préstamos por estudiante
  getByStudent: (studentId: string, params?: { status?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/loans/student/${studentId}${queryString ? `?${queryString}` : ''}`);
  },

  // Obtener préstamos atrasados
  getOverdue: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/loans/overdue${queryString ? `?${queryString}` : ''}`);
  },

  // Crear préstamo
  create: (loanData: {
    bookId: string;
    studentId: string;
    copyNumber?: number;
    dueDate?: string;
    loanedBy?: string;
    loanType?: 'normal' | 'extended' | 'special';
  }) => apiRequest('/loans', {
    method: 'POST',
    body: JSON.stringify(loanData),
  }),

  // Devolver libro
  return: (id: string, returnData?: {
    returnedBy?: string;
    notes?: string;
    condition?: 'excellent' | 'good' | 'fair' | 'poor';
  }) => apiRequest(`/loans/${id}/return`, {
    method: 'PUT',
    body: JSON.stringify(returnData || {}),
  }),

  // Renovar préstamo
  renew: (id: string, renewData?: {
    additionalDays?: number;
    reason?: string;
  }) => apiRequest(`/loans/${id}/renew`, {
    method: 'PUT',
    body: JSON.stringify(renewData || {}),
  }),

  // Crear copias de libro
  createCopies: (bookId: string, numberOfCopies: number) =>
    apiRequest('/loans/create-copies', {
      method: 'POST',
      body: JSON.stringify({ bookId, numberOfCopies }),
    }),
};

// Exportar todo
export * from './auth';
export * from './books';
