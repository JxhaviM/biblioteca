import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import type { Dispatch, SetStateAction } from 'react';
import BookTable from '../components/BookTable';
import BookGrid from '../components/BookGrid';
import CreateBookModal from '../components/CreateBookModal';
import EditBookModal from '../components/EditBookModal';
import BulkUploadBooksModal from '../components/BulkUploadBooksModal';
import BookCopiesModal from '../components/BookCopiesModal';
import { useBooks } from '../hooks/useBooks';
import { booksApi } from '../api/books';
import type { User, Person } from '../api/auth';
import type { Book } from '../api/books';

interface BooksAdminPageProps {
  user?: User | null;
  person?: Person | null;
  setUser?: Dispatch<SetStateAction<User | null>>;
  setPerson?: Dispatch<SetStateAction<Person | null>>;
}

const BooksAdminPage: React.FC<BooksAdminPageProps> = ({ user, person, setUser, setPerson }) => {
  // Hook para obtener libros de la API (sin parámetros para evitar loops)
  const { books, loading, error, refetch, searchBooks } = useBooks();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isCopiesModalOpen, setIsCopiesModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      await searchBooks(searchTerm.trim());
    } else {
      await refetch();
    }
  };

  const handleBookCreated = async () => {
    await refetch(); // Recargar libros después de crear uno nuevo
  };

  const handleBookUpdated = async () => {
    await refetch(); // Recargar libros después de actualizar uno
  };

  const handleManageCopies = (book: Book) => {
    setSelectedBook(book);
    setIsCopiesModalOpen(true);
  };

  const handleCopiesUpdated = async () => {
    await refetch(); // Recargar libros después de actualizar copias
  };

  const handleEdit = (id: string) => {
    const book = books.find(b => b._id === id);
    if (book) {
      setSelectedBook(book);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedBook(null);
  };

    const handleDelete = (id: string) => {
    // Eliminación se hace desde gestión de copias individuales
    console.log('Delete moved to copies management');
  };

  const handleImageChange = async (bookId: string, file: File) => {
    try {
      setUploadingImage(true);
      
      // Crear FormData para subir la imagen
      const formData = new FormData();
      formData.append('coverImage', file);  // Campo exacto que espera el backend
      
      const token = localStorage.getItem('token');
      
      // Usar la ruta CORRECTA del backend: PUT /api/books/:id/cover
      const response = await fetch(`${API_BASE_URL}/books/${bookId}/cover`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        // Recargar libros para mostrar la nueva imagen
        await refetch();
        alert('✅ Imagen actualizada exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      alert('Error al actualizar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Verificar si el usuario puede cambiar imágenes (admin, superadmin, o user con permiso especial)
  const canChangeImages = user?.role === 'admin' || 
                          user?.role === 'superadmin' || 
                          (user?.role === 'user' && user?.specialPermissions?.canChangeBookImages);

  return (
    
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Libros</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
    
          </div>
    
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <form onSubmit={handleSearch} className="w-full md:w-1/2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por título, autor, ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
    
            </form>
            <div className="flex gap-2 flex-wrap">
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nuevo Libro</span>
              </button>
              <button 
                onClick={() => setIsBulkUploadOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Carga Masiva</span>
              </button>
              
              {/* Botones para cambiar vista */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 flex items-center space-x-2 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 flex items-center space-x-2 rounded-r-lg ${
                    viewMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Tabla</span>
                </button>
              </div>
            </div>
    
          </div>

          {viewMode === 'grid' ? (
            <BookGrid 
              books={books} 
              loading={loading}
              user={user}
              onImageChange={handleImageChange}
              canChangeImages={canChangeImages}
              onManageCopies={handleManageCopies}
            />
          ) : (
            <BookTable 
              books={books} 
              loading={loading}
              onEdit={handleEdit}
              onManageCopies={handleManageCopies}
            />
          )}
          
          {/* TODO: Agregar paginación aquí */}
        </div>

        <CreateBookModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          onBookCreated={handleBookCreated}
        />
        
        <EditBookModal 
          isOpen={isEditModalOpen} 
          onClose={handleCloseEditModal}
          book={selectedBook}
          onBookUpdated={handleBookUpdated}
        />
        
        <BulkUploadBooksModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => {
            alert('✅ Libros cargados exitosamente');
            setIsBulkUploadOpen(false);
            refetch(); // Refrescar la lista de libros
          }}
        />

        <BookCopiesModal 
          isOpen={isCopiesModalOpen}
          onClose={() => setIsCopiesModalOpen(false)}
          book={selectedBook}
          onCopiesUpdated={handleCopiesUpdated}
          userRole={user?.role}
        />
      </div>
    </div>
  );
};

export default BooksAdminPage;
