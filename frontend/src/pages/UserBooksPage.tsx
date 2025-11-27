import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Library,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import loansApi from '../api/loans';
import { toast } from 'react-hot-toast';

interface UserDashboardProps {
  user?: any;
  onLogout?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user: propUser }) => {
  const auth = useAuth();
  const { user: authUser } = useUserData();
  const user = propUser || authUser;
  
  const [books, setBooks] = useState<any[]>([]);
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'myLoans'>('catalog');

  const genres = [
    'Ficción', 'No Ficción', 'Ciencia', 'Historia', 'Tecnología', 
    'Arte', 'Filosofía', 'Literatura', 'Educación', 'Negocios'
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Simular libros para demostración
      const mockBooks = [
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
      
      setBooks(mockBooks);
      
      const loansResponse = await loansApi.getMyLoans();
      if (loansResponse.success) {
        setMyLoans(loansResponse.loans || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchTerm || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = !selectedGenre || 
      book.genre.includes(selectedGenre);
    
    return matchesSearch && matchesGenre;
  });

  const handleRequestLoan = async (bookId: string) => {
    try {
      // Simular creación de préstamo
      toast.success('Solicitud de préstamo enviada');
      loadData(); // Recargar préstamos
    } catch (error) {
      console.error('Error requesting loan:', error);
      toast.error('Error al solicitar préstamo');
    }
  };

  const handleRequestExtension = async (loanId: string) => {
    try {
      const response = await loansApi.requestExtension(loanId, {
        reason: 'Solicitud de prórroga',
        requestedDays: 7
      });

      if (response.success) {
        toast.success('Solicitud de prórroga enviada');
        loadData();
      } else {
        toast.error(response.message || 'Error al solicitar prórroga');
      }
    } catch (error) {
      console.error('Error requesting extension:', error);
      toast.error('Error al solicitar prórroga');
    }
  };

  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado':
      case 'prestado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'devuelto':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoanStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobado':
      case 'prestado':
        return CheckCircle;
      case 'pendiente':
        return Clock;
      case 'vencido':
        return AlertCircle;
      case 'devuelto':
        return RefreshCw;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div>
        <div className="text-center">
          <Library className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Cargando tu biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Library className="h-8 w-8 mr-3" />
                Mi Biblioteca
              </h1>
              <p className="text-blue-100 mt-1">
                Bienvenido, {user?.person?.nombreCompleto || user?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-100">Préstamos activos</p>
                <p className="text-2xl font-bold">
                  {myLoans.filter(loan => loan.status === 'prestado').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'catalog'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Catálogo de Libros
              </button>
              <button
                onClick={() => setActiveTab('myLoans')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'myLoans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Mis Préstamos ({myLoans.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Catálogo Tab */}
            {activeTab === 'catalog' && (
              <div>
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>
                </div>

                {/* Books Grid */}
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron libros
                    </h3>
                    <p className="text-gray-500">
                      Intenta ajustar los filtros de búsqueda
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.map((book) => (
                      <div key={book._id} className="relative">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105">
                          <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                            <img
                              className="max-w-full max-h-full object-contain"
                              src={book.coverImage || 'https://placehold.co/192x270/E5E7EB/1F2937?text=Libro'}
                              alt={book.title}
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{book.title}</h3>
                            <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">ISBN: {book.isbn}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                book.availability?.available > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {book.availability?.available || 0} disponibles
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRequestLoan(book._id)}
                          className="mt-3 w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Solicitar Préstamo
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Loans Tab */}
            {activeTab === 'myLoans' && (
              <div>
                {myLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes préstamos
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Explora el catálogo para solicitar tu primer libro
                    </p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ver Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myLoans.map((loan) => {
                      const StatusIcon = getLoanStatusIcon(loan.status);
                      const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === 'prestado';
                      
                      return (
                        <div key={loan._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <StatusIcon className="h-5 w-5 mr-2 text-gray-600" />
                                <h4 className="text-lg font-medium text-gray-900">
                                  {loan.bookId?.title || 'Libro no encontrado'}
                                </h4>
                              </div>
                              <p className="text-gray-600 mb-1">
                                Autor: {loan.bookId?.author || 'N/A'}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Préstamo: {new Date(loan.loanStartDate).toLocaleDateString()}
                                </span>
                                <span className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Clock className="h-4 w-4 mr-1" />
                                  Devolución: {new Date(loan.dueDate).toLocaleDateString()}
                                  {isOverdue && ' (Vencido)'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLoanStatusColor(loan.status)}`}>
                                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                              </span>
                              {loan.status === 'prestado' && !isOverdue && (
                                <button
                                  onClick={() => handleRequestExtension(loan._id)}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                  Solicitar Prórroga
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
