import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookGrid from '../components/BookGrid';
import BookSearch from '../components/BookSearch';
import { useBooks } from '../hooks/useBooks';
import type { User, Person } from '../api/auth';

interface HomePageProps {
  user?: User | null;
  person?: Person | null;
  setUser?: (user: User | null) => void;
  setPerson?: (person: Person | null) => void;
  showLoginModal?: boolean;
  setShowLoginModal?: (show: boolean) => void;
}

const HomePage = ({ 
  user = null, 
  person = null, 
  setUser = () => {}, 
  setPerson = () => {},
  showLoginModal = false,
  setShowLoginModal = () => {}
}: HomePageProps = {}) => {
  const navigate = useNavigate();
  const { books, loading, error, refetch, pagination, nextPage, prevPage, searchBooks, searchBooksByGenre, searchBooksCombined } = useBooks();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedPerson = localStorage.getItem('person');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPerson) setPerson(JSON.parse(savedPerson));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('person');
    setUser(null);
    setPerson(null);
    // Recargar la página para mostrar el botón de iniciar sesión
    window.location.reload();
  };

  // Memorizar funciones de búsqueda para evitar re-renders
  const handleSearch = useCallback((searchTerm: string) => {
    searchBooks(searchTerm);
  }, [searchBooks]);

  const handleGenreFilter = useCallback((genre: string) => {
    searchBooksByGenre(genre);
  }, [searchBooksByGenre]);

  const handleCombinedSearch = useCallback((searchTerm: string, genre: string) => {
    searchBooksCombined(searchTerm, genre);
  }, [searchBooksCombined]);

  // Memorizar loading para evitar re-renders del BookSearch
  const memoizedLoading = useMemo(() => loading, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          Sistema de gestión bibliotecaria moderna
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Explora nuestro catálogo y gestiona tus préstamos fácilmente
        </p>
        {!user && (
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
          >
            Iniciar Sesión para acceder al sistema
          </button>
        )}
      </div>

      {/* Catálogo de Libros */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Catálogo de Libros</h2>
        
        {/* Buscador y Filtros */}
        <BookSearch
          onSearch={handleSearch}
          onGenreFilter={handleGenreFilter}
          onCombinedSearch={handleCombinedSearch}
          loading={memoizedLoading}
        />
        
        <BookGrid books={books} loading={loading} user={user} />
        
        {/* Paginación */}
        {!loading && books.length > 0 && pagination && (
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="text-sm text-gray-600">
              Mostrando {books.length} de {pagination.total} libros 
              {pagination.pages > 1 && ` (Página ${pagination.page} de ${pagination.pages})`}
            </div>
            
            {pagination.pages > 1 && (
              <div className="flex space-x-2">
                <button
                  onClick={prevPage}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                
                <span className="px-4 py-2 bg-green-600 text-white rounded-lg">
                  {pagination.page}
                </span>
                
                <button
                  onClick={nextPage}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-gray-600 mt-12">
        <p className="text-lg font-semibold mb-2">Sistema de Biblioteca MERN</p>
        <p>Explora nuestro catálogo completo de libros disponibles</p>
        {!user && (
          <p className="text-sm mt-2">
            Para solicitar préstamos, por favor inicia sesión
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
