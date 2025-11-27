import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Eye, Library } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string[];
  publishedYear?: number;
  description?: string;
  coverImage?: string;
  location?: string;
  language?: string;
  publisher?: string;
  pages?: number;
  availability?: {
    total: number;
    available: number;
    borrowed: number;
  };
}

const PublicBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const genres = [
    'Ficción', 'No Ficción', 'Ciencia', 'Historia', 'Tecnología', 
    'Arte', 'Filosofía', 'Literatura', 'Educación', 'Negocios'
  ];

  useEffect(() => {
    // Simular carga de libros
    const mockBooks: Book[] = [
      {
        _id: '1',
        title: 'Cien años de soledad',
        author: 'Gabriel García Márquez',
        isbn: '978-0-06-088328-7',
        genre: ['Ficción', 'Literatura'],
        publishedYear: 1967,
        description: 'Una obra maestra de la literatura latinoamericana',
        coverImage: 'https://placehold.co/192x270/E5E7EB/1F2937?text=Cien+años',
        availability: {
          total: 5,
          available: 3,
          borrowed: 2
        }
      },
      {
        _id: '2',
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-452-28423-4',
        genre: ['Ficción', 'Ciencia Ficción'],
        publishedYear: 1949,
        description: 'Una novela distópica clásica',
        coverImage: 'https://placehold.co/192x270/E5E7EB/1F2937?text=1984',
        availability: {
          total: 3,
          available: 1,
          borrowed: 2
        }
      }
    ];
    
    setTimeout(() => {
      setBooks(mockBooks);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredBooks = books?.filter(book => {
    const matchesSearch = !searchTerm || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm);
    
    const matchesGenre = !selectedGenre || 
      book.genre.includes(selectedGenre);
    
    return matchesSearch && matchesGenre;
  }) || [];

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'author':
        return a.author.localeCompare(b.author);
      case 'year':
        return (b.publishedYear || 0) - (a.publishedYear || 0);
      case 'available':
        return (b.availability?.available || 0) - (a.availability?.available || 0);
      default:
        return 0;
    }
  });

  const handleBookClick = (book: Book) => {
    // Aquí podría abrir un modal con detalles del libro
    toast.success(`Seleccionaste: ${book.title}`);
  };

  if (loading) {
    return (
      <div>
        <div className="text-center">
          <Library className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Cargando catálogo de libros...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
              <Library className="h-10 w-10 mr-3" />
              Catálogo de la Biblioteca
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Explora nuestra colección de libros disponibles para préstamo
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor o ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los géneros</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="title">Ordenar por título</option>
                <option value="author">Ordenar por autor</option>
                <option value="year">Ordenar por año</option>
                <option value="available">Más disponibles</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredBooks.length} libro{filteredBooks.length !== 1 ? 's' : ''} encontrado{filteredBooks.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Books Display */}
        {sortedBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedGenre ? 'No se encontraron libros' : 'No hay libros disponibles'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedGenre 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'No hay libros en el catálogo en este momento'
              }
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedBooks.map((book) => (
                  <div 
                    key={book._id} 
                    onClick={() => handleBookClick(book)}
                    className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 cursor-pointer"
                  >
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <img
                        className="max-w-full max-h-full object-contain"
                        src={book.coverImage || 'https://placehold.co/192x270/E5E7EB/1F2937?text=Libro'}
                        alt={book.title}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">ISBN: {book.isbn}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          (book.availability?.available || 0) > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {book.availability?.available || 0} disponibles
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {book.genre.slice(0, 2).map((g, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {g}
                          </span>
                        ))}
                        {book.genre.length > 2 && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            +{book.genre.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Libro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Autor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Género
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Disponibilidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedBooks.map((book) => (
                        <tr key={book._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {book.coverImage ? (
                                <img 
                                  src={book.coverImage} 
                                  alt={book.title}
                                  className="h-10 w-10 rounded-lg object-cover mr-3"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                  <BookOpen className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {book.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ISBN: {book.isbn}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {book.author}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {book.genre.slice(0, 2).map((g, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                >
                                  {g}
                                </span>
                              ))}
                              {book.genre.length > 2 && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  +{book.genre.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                (book.availability?.available || 0) > 0 ? 'bg-green-400' : 'bg-red-400'
                              }`} />
                              <span className="text-sm text-gray-900">
                                {book.availability?.available || 0}/{book.availability?.total || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleBookClick(book)}
                              className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Library className="h-8 w-8 mr-2" />
              <span className="text-lg font-semibold">Biblioteca Virtual</span>
            </div>
            <p className="text-gray-400">
              © 2024 Biblioteca. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBooksPage;
