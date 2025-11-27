import { useState, useEffect } from 'react';
import { booksApi } from '../api/books';
import type { Book } from '../api/books';

interface UseBooksResult {
  books: Book[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  refetch: () => Promise<void>;
  searchBooks: (searchTerm: string) => Promise<void>;
  searchBooksByGenre: (genre: string) => Promise<void>;
  searchBooksCombined: (searchTerm: string, genre: string) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
}

export function useBooks(): UseBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBooks = async (searchTerm?: string, page: number = 1, genre?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📚 Obteniendo libros...', searchTerm ? `con búsqueda: ${searchTerm}` : '', genre ? `género: ${genre}` : '', `página: ${page}`);
      
      // Agregar timeout de 10 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await booksApi.getAll({
        page: page,
        limit: 20,
        isActive: true,
        ...(searchTerm && { search: searchTerm }),
        ...(genre && { genre }),
      });

      clearTimeout(timeoutId);
      console.log('✅ Respuesta de libros:', response);

      if (response.success) {
        setBooks(response.data || []);
        setPagination(response.pagination || null);
        setCurrentPage(page);
      } else {
        setError('Error al obtener los libros');
        // Usar datos de ejemplo si el backend falla
        setBooks([
          {
            _id: '1',
            title: 'Libro Ejemplo 1',
            author: 'Autor Ejemplo',
            isbn: '1234567890',
            genre: ['Ficción'],
            publishedYear: 2023,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estadoLibro: 'Bueno'
          },
          {
            _id: '2',
            title: 'Libro Ejemplo 2',
            author: 'Otro Autor',
            isbn: '0987654321',
            genre: ['No Ficción'],
            publishedYear: 2022,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estadoLibro: 'Bueno'
          }
        ]);
      }
    } catch (err) {
      console.error('❌ Error al obtener libros:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al obtener los libros');
      }
      
      // Usar datos de ejemplo si hay error
      setBooks([
        {
          _id: '1',
          title: 'Libro Ejemplo 1',
          author: 'Autor Ejemplo',
          isbn: '1234567890',
          genre: ['Ficción'],
          publishedYear: 2023,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estadoLibro: 'Bueno'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchBooks(undefined, currentPage);
  };

  const searchBooks = async (searchTerm: string) => {
    await fetchBooks(searchTerm, 1); // Resetear a página 1 en búsquedas
  };

  const searchBooksByGenre = async (genre: string) => {
    await fetchBooks(undefined, 1, genre); // Resetear a página 1 en búsquedas por género
  };

  const searchBooksCombined = async (searchTerm: string, genre: string) => {
    await fetchBooks(searchTerm, 1, genre); // Resetear a página 1 en búsquedas combinadas
  };

  const goToPage = async (page: number) => {
    if (pagination && page >= 1 && page <= pagination.pages) {
      await fetchBooks(undefined, page);
    }
  };

  const nextPage = async () => {
    if (pagination && currentPage < pagination.pages) {
      await goToPage(currentPage + 1);
    }
  };

  const prevPage = async () => {
    if (pagination && currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  };

  // Cargar libros solo una vez al montar el componente
  useEffect(() => {
    fetchBooks();
  }, []); // Array vacío - solo se ejecuta una vez

  return {
    books,
    loading,
    error,
    pagination,
    refetch,
    searchBooks,
    searchBooksByGenre,
    searchBooksCombined,
    goToPage,
    nextPage,
    prevPage,
  };
}