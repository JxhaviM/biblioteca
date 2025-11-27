import { useState } from 'react';
import { booksApi } from '../api/books';
import type { Book } from '../api/books';

interface UseCreateBookResult {
  createBook: (data: Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'> & { initialCopies?: number } | FormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useCreateBook(): UseCreateBookResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createBook = async (data: Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'> & { initialCopies?: number } | FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    console.log('🚀 Enviando datos al backend...', data instanceof FormData ? 'FormData' : data);
    
    try {
      const result = await booksApi.create(data);
      console.log('✅ Libro creado exitosamente:', result);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Error al crear libro:', err);
      
      // Manejar específicamente errores de conflicto de ISBN
      if (err.message && err.message.includes('ISBN')) {
        if (err.message.includes('409') || err.message.includes('conflicto')) {
          setError('⚠️ ' + err.message);
        } else {
          setError('📚 ' + err.message);
        }
      } else if (err.message && err.message.includes('400')) {
        setError('❌ Datos inválidos: ' + err.message);
      } else if (err.message && err.message.includes('401')) {
        setError('🔒 No autorizado: Inicia sesión nuevamente');
      } else if (err.message && err.message.includes('403')) {
        setError('🚫 No tienes permisos para crear libros');
      } else if (err.message && err.message.includes('500')) {
        setError('💥 Error del servidor: Intenta nuevamente más tarde');
      } else if (err instanceof Error) {
        setError('❌ ' + (err.message || 'Error al crear el libro'));
      } else {
        setError('❌ Error al crear el libro');
      }
      throw err; // Re-lanzar el error para que se pueda manejar en el componente
    } finally {
      setLoading(false);
    }
  };

  return { createBook, loading, error, success };
}
