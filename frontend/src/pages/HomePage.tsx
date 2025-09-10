import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

// Definir tipo Book local (temporal hasta que tengamos la API)
interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  stock: number;
  location: string;
  description: string;
  available: boolean;
  coverImage: string;
}

// Componente para la tarjeta de cada libro
const BookCard = ({ book }: { book: Book }) => {
  const isAvailable = book.stock > 0;
  const statusClasses = isAvailable
    ? 'bg-green-600 text-white'
    : 'bg-red-500 text-white';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105">
      <img
        className="w-full h-48 object-cover"
        src="https://placehold.co/600x400/E5E7EB/1F2937?text=Libro"
        alt={book.title}
      />
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800">{book.title}</h3>
        <p className="text-sm text-gray-600 mt-1">Autor: {book.author}</p>
        <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
        <div className="mt-4">
          <span className={`px-3 py-1 text-sm rounded-full font-semibold ${statusClasses}`}>
            {isAvailable ? 'Disponible' : 'Prestado'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente de la página principal
const HomePage = () => {
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    console.log('🏠 HomePage (Catálogo Público) - Path actual:', location.pathname);
    console.log('🏠 HomePage - Información completa de location:', location);
  }, [location]);

  // Datos dummy mientras implementamos la API real
  const dummyBooks: Book[] = [
    {
      id: '1',
      title: "El suspiro del dragón",
      author: "Laura Sofía Vargas",
      isbn: "978-7778889990",
      genre: "Fantasía Épica",
      publishedYear: 2012,
      stock: 10,
      location: "Estante Fantasía Moderna",
      description: "Una épica aventura de dragones y magia",
      available: true,
      coverImage: "https://placehold.co/600x400/E5E7EB/1F2937?text=Libro"
    },
    {
      id: '2',
      title: "Crónicas de un futuro olvidado",
      author: "Daniel Ricardo Ospina",
      isbn: "978-7778889991",
      genre: "Ciencia Ficción",
      publishedYear: 2020,
      stock: 0,
      location: "Sección Futuro y Sociedad",
      description: "Una visión distópica del mañana",
      available: false,
      coverImage: "https://placehold.co/600x400/E5E7EB/1F2937?text=Libro"
    },
    {
      id: '3',
      title: "El misterio de la rosa azul",
      author: "Paula Andrea Giraldo",
      isbn: "978-7778889992",
      genre: "Misterio",
      publishedYear: 2018,
      stock: 3,
      location: "Novela Romántica con Intriga",
      description: "Un intrigante misterio por resolver",
      available: true,
      coverImage: "https://placehold.co/600x400/E5E7EB/1F2937?text=Libro"
    },
    {
      id: '4',
      title: "La melancolía del invierno",
      author: "Clara Beltrán",
      isbn: "978-1112223332",
      genre: "Drama",
      publishedYear: 2020,
      stock: 5,
      location: "Literatura Contemporánea",
      description: "Una historia emotiva de amor y pérdida",
      available: true,
      coverImage: "https://placehold.co/600x400/E5E7EB/1F2937?text=Libro"
    },
  ];

  // Cargar libros (por ahora usamos datos dummy, luego conectaremos a la API)
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        
        // TODO: Descomentar cuando la API esté lista
        // const response = await booksApi.getBooks();
        // setBooks(response);
        
        // Por ahora usamos datos dummy
        setTimeout(() => {
          setBooks(dummyBooks);
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error loading books:', err);
        setError('Error al cargar los libros');
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // Obtener géneros únicos de los libros
  const genres = ['Todos', ...new Set(dummyBooks.map(book => book.genre))];

  // Filtrar libros según búsqueda y género
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'Todos' || selectedGenre === '' || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-700">Mi Biblioteca MERN</h1>
        </nav>
        <div className="text-center p-8 text-xl">Cargando libros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-700">Mi Biblioteca MERN</h1>
        </nav>
        <div className="text-center p-8 text-red-500">Error al cargar los libros.</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Barra de Navegación */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">Mi Biblioteca MERN</h1>
        <div className="flex space-x-4">
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => setShowLoginModal(true)}
          >
            Iniciar Sesión
          </button>
          <button className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors">
            Registrarse
          </button>
        </div>
      </nav>

      {/* Contenedor principal */}
      <main className="container mx-auto p-8">
        <h2 className="text-4xl font-extrabold text-green-700 mb-6 text-center">
          Catálogo de Libros
        </h2>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-700">{books.length}</h3>
            <p className="text-green-600">Libros en catálogo</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-blue-700">{books.filter(book => book.available).length}</h3>
            <p className="text-blue-600">Disponibles</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-purple-700">{genres.length - 1}</h3>
            <p className="text-purple-600">Géneros diferentes</p>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <input
            type="text"
            className="w-full p-3 pl-10 text-lg border border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Buscar por título o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full sm:w-auto p-3 text-lg border border-yellow-400 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Contador de resultados */}
        <div className="mb-4">
          <p className="text-gray-600">
            Mostrando {filteredBooks.length} de {books.length} libros
            {searchTerm && ` para "${searchTerm}"`}
            {selectedGenre && selectedGenre !== 'Todos' && ` en "${selectedGenre}"`}
          </p>
        </div>

        {/* Grilla de Libros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl text-gray-600 mb-2">
                No se encontraron libros
              </p>
              <p className="text-gray-500">
                Intenta cambiar los filtros o el término de búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Footer con información */}
        <footer className="mt-16 py-8 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="text-lg font-semibold mb-2">Sistema de Biblioteca MERN</p>
            <p>Explora nuestro catálogo completo de libros disponibles</p>
            <p className="text-sm mt-2">
              Para solicitar préstamos, por favor inicia sesión o regístrate
            </p>
          </div>
        </footer>
      </main>

      {/* Modal de Login */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(userData) => {
          console.log('Login exitoso desde HomePage:', userData);
          // El modal ya maneja la redirección
        }}
      />
    </div>
  );
};

export default HomePage;