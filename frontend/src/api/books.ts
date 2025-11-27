// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Función helper para hacer requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // No agregar Content-Type si el body es FormData
  const headers: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Agregar token de autenticación si existe
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('🌐 Fetching:', url);
    console.log('🔑 Token exists:', !!token);
    const response = await fetch(url, config);
    
    console.log('✅ Response status:', response.status);
    
    if (!response.ok) {
      // Manejar diferentes códigos de estado
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        
        if (response.status === 409) {
          // Error de conflicto (ISBN duplicado)
          errorMessage = errorData.message || 'Ya existe un libro con este ISBN';
          if (errorData.existingBook) {
            errorMessage += `\n\nLibro existente: "${errorData.existingBook.title}" por ${errorData.existingBook.author}`;
          }
          if (errorData.suggestion) {
            errorMessage += `\n\n💡 Sugerencia: ${errorData.suggestion}`;
          }
        } else if (response.status === 400) {
          errorMessage = errorData.message || 'Datos inválidos';
        } else if (response.status === 401) {
          errorMessage = 'No autorizado - Inicia sesión nuevamente';
        } else if (response.status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción';
        } else if (response.status === 500) {
          errorMessage = 'Error del servidor - Intenta nuevamente más tarde';
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } catch (parseError) {
        // Si no se puede parsear el JSON, usar el mensaje genérico
        console.warn('Could not parse error response JSON:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ API Request failed:', url, error);
    throw error;
  }
};

// Tipos para los libros
export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string[]; // Cambiar a array para coincidir con el backend
  publishedYear: number;
  location?: string;
  description?: string;
  language?: string;
  publisher?: string;
  pages?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  estadoLibro: 'Bueno' | 'Regular' | 'Malo';
  grado?: string;
  availability?: {
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    isAvailable: boolean;
  };
}

export interface BookAvailability {
  bookId: string;
  title: string;
  totalCopies: number;
  availableCopies: number;
  loanedCopiesCount: number;
  availableCopyNumbers: number[];
  loanedCopies: Array<{
    copyNumber: number;
    studentName: string;
    dueDate: string;
  }>;
}

// Servicios de libros
export const booksApi = {
  // Obtener todos los libros
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.genre) queryParams.append('genre', params.genre);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/books${queryString ? `?${queryString}` : ''}`);
  },

  // Buscar libros (búsqueda avanzada)
  search: (params: {
    search?: string;
    author?: string;
    genre?: string;
    publishedYear?: number;
    available?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    return apiRequest(`/books/search?${queryParams.toString()}`);
  },

  // Obtener libro por ID
  getById: (id: string) => apiRequest(`/books/${id}`),

  // Obtener disponibilidad de un libro
  getAvailability: (id: string): Promise<{ success: boolean; availability: BookAvailability }> => 
    apiRequest(`/books/${id}/availability`),

  // Crear libro
  create: (bookData: Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'> & { initialCopies?: number } | FormData) => {
    // Si es FormData, enviar directamente
    if (bookData instanceof FormData) {
      return apiRequest('/books', {
        method: 'POST',
        body: bookData,
      });
    } else {
      return apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
      });
    }
  },

  // Crear múltiples libros
  createBulk: (books: Array<Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'> & { initialCopies?: number }>) =>
    apiRequest('/books/bulk', {
      method: 'POST',
      body: JSON.stringify(books),
    }),

  // Actualizar libro
  update: (id: string, bookData: Partial<Omit<Book, '_id' | 'createdAt' | 'updatedAt'>> | FormData) => {
    // Si es FormData, enviar directamente
    if (bookData instanceof FormData) {
      return apiRequest(`/books/${id}`, {
        method: 'PUT',
        body: bookData,
      });
    } else {
      return apiRequest(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookData),
      });
    }
  },

  // Eliminar libro (soft delete)
  delete: (id: string) => apiRequest(`/books/${id}`, { method: 'DELETE' }),

  // Actualizar portada de libro
  updateBookCover: (id: string, formData: FormData) => 
    apiRequest(`/books/${id}/cover`, {
      method: 'PUT',
      body: formData,
    }),
};

// Función de conveniencia para actualizar libro
export const updateBook = (id: string, bookData: Partial<Omit<Book, '_id' | 'createdAt' | 'updatedAt'>> | FormData) => 
  booksApi.update(id, bookData);