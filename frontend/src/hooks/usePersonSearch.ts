import { useState, useEffect, useCallback } from 'react';
import { getPersons, getPersonsWithoutAccount } from '../api/persons';
import type { Person } from '../types';

interface UsePersonSearchOptions {
  withoutAccount?: boolean; // Si true, usa getPersonsWithoutAccount
  debounceMs?: number; // Milliseconds para debounce
  autoLoad?: boolean; // Si cargar automáticamente al inicio
}

interface UsePersonSearchReturn {
  // Estados
  persons: Person[];
  loading: boolean;
  error: string | null;
  
  // Funciones
  searchPersons: (query: string) => void;
  loadPersons: () => void;
  clearSearch: () => void;
  clearError: () => void;
  
  // Información
  hasResults: boolean;
  resultCount: number;
}

export const usePersonSearch = (options: UsePersonSearchOptions = {}): UsePersonSearchReturn => {
  const {
    withoutAccount = false,
    debounceMs = 300,
    autoLoad = true
  } = options;

  // Estados
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Función para cargar personas
  const loadPersons = useCallback(async (query = '') => {
    // DEBUG: mostrar qué instancia está llamando y con qué parámetros
    try {
      console.log('[usePersonSearch] loadPersons called', {
        withoutAccount,
        query
      });
    } catch {
      // noop
    }
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (withoutAccount) {
        response = await getPersonsWithoutAccount(query || undefined);
      } else {
        response = await getPersons(query || undefined);
      }
      // DEBUG: log response size and sample
      try {
        // Extract readable summary to ensure console prints useful text (not collapsed Objects)
        const dataLength = Array.isArray(response?.data) ? response.data.length : undefined;
        const serialized = Array.isArray(response?.data) ? response.data.slice(0, 10).map((item: unknown) => JSON.stringify(item)) : undefined;
        // Try to extract short id/name from serialized entries
        const short = serialized ? serialized.map(s => {
          // crude extraction: find _id and nombre/apellido substrings
          const idMatch = s.match(/"?_?id"?\s*:\s*"([^"]+)"/i) || s.match(/"_id"\s*:\s*"([^"]+)"/i);
          const nombreMatch = s.match(/"nombre1"\s*:\s*"([^"]+)"/i);
          const apellidoMatch = s.match(/"apellido1"\s*:\s*"([^"]+)"/i);
          return `${idMatch ? idMatch[1] : 'id?' } / ${nombreMatch ? nombreMatch[1] : ''} ${apellidoMatch ? apellidoMatch[1] : ''}`.trim();
        }) : undefined;
        console.log('[usePersonSearch] response received', `withoutAccount=${withoutAccount}`, `query="${query}"`, `success=${!!response?.success}`, `dataLength=${dataLength}`, `items=${JSON.stringify(short)}`);
      } catch {
        // noop
      }

      if (response.success && Array.isArray(response.data)) {
        setPersons(response.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setPersons([]);
    } finally {
      setLoading(false);
    }
  }, [withoutAccount]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (autoLoad) {
        loadPersons();
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      loadPersons(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, loadPersons, debounceMs, autoLoad]);

  // Cargar inicial
  useEffect(() => {
    if (autoLoad && !searchQuery) {
      loadPersons();
    }
  }, [autoLoad, loadPersons, searchQuery]);

  // Funciones públicas
  const searchPersons = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const manualLoad = useCallback(() => {
    loadPersons(searchQuery);
  }, [loadPersons, searchQuery]);

  return {
    // Estados
    persons,
    loading,
    error,
    
    // Funciones
    searchPersons,
    loadPersons: manualLoad,
    clearSearch,
    clearError,
    
    // Información computada
    hasResults: persons.length > 0,
    resultCount: persons.length
  };
};