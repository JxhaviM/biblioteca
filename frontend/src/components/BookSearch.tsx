import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';

interface BookSearchProps {
  onSearch: (searchTerm: string) => void;
  onGenreFilter: (genre: string) => void;
  onCombinedSearch: (searchTerm: string, genre: string) => void;
  loading?: boolean;
}

const BookSearch: React.FC<BookSearchProps> = memo(({
  onSearch,
  onGenreFilter,
  onCombinedSearch,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState<{ value: string; label: string }[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Obtener géneros dinámicamente de la base de datos
  const fetchGenres = useCallback(async () => {
    try {
      setLoadingGenres(true);
      console.log('🔄 Actualizando géneros desde la base de datos...');
      
      // Usar el endpoint especial que devuelve TODOS los libros sin agregación
      const response = await fetch('/api/books/genres/all?isActive=true');
      const data = await response.json();
      
      console.log('📊 Respuesta de libros para géneros:', data);
      
      if (data.success && data.genres) {
        // Usar los géneros ya procesados por el backend
        const allGenres = data.genres;
        
        console.log('🎭 Géneros del backend:', allGenres);

        // Convertir a formato para el select
        const genreOptions = [
          { value: '', label: 'Todas las áreas' },
          ...allGenres
            .sort()
            .map((genre: string) => {
              // Quitar comillas para el label pero mantenerlas para el value
              const cleanLabel = genre.replace(/^["']|["']$/g, '');
              const capitalizedLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1).toLowerCase();
              return {
                value: genre, // Mantener el valor exacto
                label: capitalizedLabel // Label legible
              };
            })
        ];

        setGenres(genreOptions);
        console.log('🎭 Géneros dinámicos cargados:', genreOptions.map(g => ({ label: g.label, value: g.value })));
        console.log('📊 Total de géneros encontrados:', allGenres.length);
        console.log('🔍 Géneros originales de BD:', allGenres);
        
        // Mostrar alerta si se encontraron nuevos géneros
        if (allGenres.length > 0) {
          console.log(`✅ Se encontraron ${allGenres.length} géneros en la base de datos`);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando géneros:', error);
      // Géneros de fallback
      setGenres([
        { value: '', label: 'Todas las áreas' },
        { value: 'CIENCIAS NATURALES', label: 'Ciencias Naturales' },
        { value: 'ESPAÑOL', label: 'Español' },
        { value: 'FISICA', label: 'Física' },
        { value: 'MATEMATICAS', label: 'Matemáticas' },
        { value: 'QUIMICA', label: 'Química' }
      ]);
    } finally {
      setLoadingGenres(false);
    }
  }, []);

  // Cargar géneros al montar el componente
  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  // Auto-refresh eliminado - solo refresh manual o cuando creas un nuevo libro

  // Refresh cuando la página gana foco (después de modificar un libro)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Página ganó foco - actualizando géneros...');
        fetchGenres();
      }
    };

    const handleFocus = () => {
      console.log('🎯 Ventana ganó foco - actualizando géneros...');
      fetchGenres();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchGenres]);

  // Función de búsqueda con debounce mejorado
  const debouncedSearch = useCallback((term: string, genre: string) => {
    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Configurar nuevo timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (genre) {
        onCombinedSearch(term, genre);
      } else {
        onSearch(term);
      }
    }, 1000); // ⏱️ 1000ms (1 segundo) para escribir tranquilo
  }, [onSearch, onCombinedSearch]);

  // Limpiar timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Usar búsqueda con debounce para no perder el foco
    debouncedSearch(value, selectedGenre);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genre = e.target.value;
    console.log('🎭 Genre seleccionado:', genre);
    setSelectedGenre(genre);
    
    // Aplicar filtro de género
    if (genre) {
      console.log('🔍 Llamando onCombinedSearch con:', { searchTerm, genre });
      onCombinedSearch(searchTerm, genre);
    } else {
      console.log('🔍 Llamando onSearch con:', searchTerm);
      onSearch(searchTerm);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    onSearch('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedGenre) {
        onCombinedSearch(searchTerm, selectedGenre);
      } else {
        onSearch(searchTerm);
      }
    }
  };

  const hasActiveFilters = searchTerm || selectedGenre;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Campo de búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              placeholder="Buscar libros por título, autor o ISBN..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
              disabled={loading}
            />
          </div>
        </div>

        {/* Selector de área/género */}
        <div className="lg:w-64">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedGenre}
              onChange={handleGenreChange}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm appearance-none transition-colors"
              disabled={loading || loadingGenres}
            >
              {loadingGenres ? (
                <option value="">Cargando áreas...</option>
              ) : (
                genres.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {loadingGenres ? (
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Botón de refresh géneros */}
        <div className="flex items-end">
          <button
            onClick={fetchGenres}
            disabled={loadingGenres}
            className="inline-flex items-center px-3 py-3 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar áreas desde la base de datos"
          >
            <RefreshCw className={`h-4 w-4 ${loadingGenres ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">
              Actualizar {genres.length > 1 && `(${genres.length - 1})`}
            </span>
          </button>
        </div>

        {/* Botón de limpiar filtros */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Indicador de búsqueda activa */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Search className="h-3 w-3 mr-1" />
              Buscando: "{searchTerm}"
            </span>
          )}
          {selectedGenre && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Filter className="h-3 w-3 mr-1" />
              Área: {selectedGenre}
            </span>
          )}
        </div>
      )}

      {/* Mensaje de ayuda cuando no hay filtros activos */}
      {!hasActiveFilters && !loading && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          💡 Usa el buscador para encontrar libros por título, autor o ISBN, o selecciona un área para filtrar por género
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Buscando libros...
        </div>
      )}
    </div>
  );
});

export default memo(BookSearch);
