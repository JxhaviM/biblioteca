import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useLocation } from 'react-router-dom';
import { booksApi, type Book } from '../api/books';
import loansApi from '../api/loans';
import type { Loan } from '../api/loans';
import { type User } from '../api/auth';
import { useUserContext } from '../contexts/UserContext';
import PaginatedBookGrid from '../components/PaginatedBookGrid';
import LoansSection from '../components/LoansSection';
import LoanRequestModal from '../components/LoanRequestModal';

const UserDashboard = () => {
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [requestingLoan, setRequestingLoan] = useState(false);

  useEffect(() => {
    console.log('👤 UserDashboard - Path actual:', location.pathname);
  }, [location]);

  // Cargar libros disponibles
  const loadBooks = async () => {
    try {
      setLoading(true);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      );
      
      const response = await Promise.race([
        booksApi.getAll({ isActive: true }),
        timeoutPromise
      ]);
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setBooks(response.data || []);
      } else {
        throw new Error('Error al cargar libros');
      }
    } catch (error) {
      console.error('Error al cargar libros:', error);
      setError('No se pudieron cargar los libros. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para solicitar préstamo
  const handleLoanRequest = (bookId: string) => {
    const book = books.find(b => b._id === bookId);
    if (book) {
      setSelectedBook(book);
      setLoanModalOpen(true);
    }
  };

  // Función para confirmar préstamo
  const handleConfirmLoan = async (bookId: string) => {
    try {
      setRequestingLoan(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('${API_BASE_URL}/loans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: bookId,
          userId: user?._id,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 días
        })
      });
      
      if (response.ok) {
        alert('✅ Préstamo solicitado exitosamente');
        // Actualizar disponibilidad del libro
        setBooks(prev => prev.map(book => {
          if (book._id === bookId && book.availability) {
            return {
              ...book,
              availability: {
                ...book.availability,
                availableCopies: Math.max(0, book.availability.availableCopies - 1)
              }
            };
          }
          return book;
        }));
      } else {
        throw new Error('Error al solicitar préstamo');
      }
    } catch (error) {
      console.error('Error al solicitar préstamo:', error);
      alert('❌ Error al solicitar el préstamo. Por favor, inténtalo de nuevo.');
    } finally {
      setRequestingLoan(false);
    }
  };

  // Función para actualizar imagen de libro
  const handleImageUpdate = async (bookId: string, imageFile: File) => {
    try {
      setUploadingImage(true);
      console.log('🖼️ Subiendo imagen para libro:', bookId);
      console.log('📁 Archivo:', imageFile.name, 'Tamaño:', imageFile.size);
      
      // Usar la ruta CORRECTA del backend: PUT /api/books/:id/cover
      const formData = new FormData();
      formData.append('coverImage', imageFile);  // Campo exacto que espera el backend
      
      const token = localStorage.getItem('token');
      console.log('🔐 Token:', token ? 'Presente' : 'Ausente');
      
      const response = await fetch(`${API_BASE_URL}/books/${bookId}/cover`, {
        method: 'PUT',  // Método CORRECTO según backend
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Response data:', result);
        // Recargar libros para mostrar la nueva imagen
        await loadBooks();
        alert('✅ Imagen actualizada exitosamente');
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      alert('Error al actualizar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Verificar si el usuario puede cambiar imágenes
  const { user } = useUserContext();
  const canChangeImages = user?.role === 'admin' || 
                          user?.role === 'superadmin' || 
                          (user?.role === 'user' && user?.specialPermissions?.canChangeBookImages) ||
                          // Permitir en modo desarrollo para testing
                          (user?.role === 'user' && window.location.hostname === 'localhost');

  useEffect(() => {
    loadBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Bienvenida elegante del estudiante */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur p-4 rounded-2xl">
              <span className="text-3xl">🎓</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                ¡Bienvenido a tu Biblioteca! 👋
              </h1>
              <p className="text-emerald-100 font-medium">Explora nuestro catálogo y gestiona tus préstamos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal - Grid de libros */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar libros por título, autor o género..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
            </div>
          </div>

          {/* Grid de libros con paginación */}
          <PaginatedBookGrid 
            books={books} 
            loading={loading}
            searchTerm={searchTerm}
            canChangeImages={canChangeImages}
            onImageChange={handleImageUpdate}
            onLoanRequest={handleLoanRequest}
          />
        </div>
      </div>
      
      {/* Modal de solicitud de préstamo */}
      <LoanRequestModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        book={selectedBook}
        onSubmit={handleConfirmLoan}
        loading={requestingLoan}
      />
    </div>
  );
};

export default UserDashboard;
