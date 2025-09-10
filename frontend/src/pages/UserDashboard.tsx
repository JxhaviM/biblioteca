import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { booksApi, type Book } from '../api/books';
import { type User } from '../api/auth';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

const UserDashboard = ({ user, onLogout }: UserDashboardProps) => {
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  useEffect(() => {
    console.log('👤 UserDashboard - Path actual:', location.pathname);
    console.log('👤 UserDashboard - Información completa de location:', location);
  }, [location]);

  // Cargar libros disponibles
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await booksApi.getAll({ isActive: true });
        
        if (response.success) {
          setBooks(response.books || []);
        } else {
          setError('Error al cargar libros');
        }
      } catch (err) {
        setError('Error de conexión');
        console.error('Error loading books:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // Filtrar libros
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !selectedGenre || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // Obtener géneros únicos
  const genres = [...new Set(books.map(book => book.genre))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Cargando Catálogo</h2>
            <p className="text-gray-600">Preparando tu biblioteca...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100">
      {/* Header del estudiante */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-2xl">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">
                  ¡Hola, {user.name}! 👋
                </h1>
                <p className="text-gray-600 font-medium">Explora nuestro catálogo de libros</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center space-x-2"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <span className="text-3xl">🔍</span>
            <span>Buscar Libros</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Búsqueda por título/autor */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Título o Autor
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: Cien años de soledad, García Márquez..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filtro por género */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Género
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">Todos los géneros</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="text-emerald-600 font-semibold">Total de Libros</p>
                  <p className="text-2xl font-bold text-emerald-800">{books.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-blue-600 font-semibold">Disponibles</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {books.filter(book => book.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-purple-600 font-semibold">Resultados</p>
                  <p className="text-2xl font-bold text-purple-800">{filteredBooks.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de libros */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Error de Conexión</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              {searchTerm || selectedGenre ? 'No se encontraron resultados' : 'Catálogo vacío'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedGenre 
                ? 'Intenta ajustar tus filtros de búsqueda' 
                : 'Aún no hay libros registrados en el sistema'}
            </p>
            {(searchTerm || selectedGenre) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGenre('');
                }}
                className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div key={book._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Header del libro */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 font-medium">Por {book.author}</p>
                    </div>
                    <div className="text-3xl ml-4">📖</div>
                  </div>

                  {/* Información del libro */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Género:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                        {book.genre}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">ISBN:</span>
                      <span className="font-mono text-gray-700">{book.isbn}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Año:</span>
                      <span className="text-gray-700 font-medium">{book.publishedYear}</span>
                    </div>
                  </div>

                  {/* Disponibilidad */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${
                          book.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-sm font-medium text-gray-700">
                          {book.isActive ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {book.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    {book.isActive ? (
                      <button className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105">
                        📚 Solicitar Préstamo
                      </button>
                    ) : (
                      <button disabled className="w-full mt-4 bg-gray-200 text-gray-500 py-3 px-4 rounded-xl font-semibold cursor-not-allowed">
                        ❌ No disponible
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
