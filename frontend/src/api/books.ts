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

// Tipos para los libros
export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  location?: string;
  description?: string;
  language?: string;
  publisher?: string;
  pages?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  create: (bookData: Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'> & { initialCopies?: number }) => 
    apiRequest('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    }),

  // Crear múltiples libros
  createBulk: (books: Array<Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'> & { initialCopies?: number }>) =>
    apiRequest('/books/bulk', {
      method: 'POST',
      body: JSON.stringify(books),
    }),

  // Actualizar libro
  update: (id: string, bookData: Partial<Omit<Book, '_id' | 'createdAt' | 'updatedAt'>>) =>
    apiRequest(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    }),

  // Eliminar libro (soft delete)
  delete: (id: string) => apiRequest(`/books/${id}`, { method: 'DELETE' }),
};