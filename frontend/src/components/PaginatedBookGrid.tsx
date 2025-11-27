import React, { useState, useMemo } from 'react';
import CompactBookCard from './CompactBookCard';
import Pagination from './Pagination';
import type { Book } from '../api/books';

interface PaginatedBookGridProps {
  books: Book[];
  loading?: boolean;
  onLoanRequest?: (bookId: string) => void;
  onImageChange?: (bookId: string, file: File) => void;
  canChangeImages?: boolean;
  searchTerm?: string;
}

const PaginatedBookGrid: React.FC<PaginatedBookGridProps> = ({ 
  books, 
  loading = false, 
  onLoanRequest, 
  onImageChange, 
  canChangeImages,
  searchTerm = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filtrar libros por término de búsqueda
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return books;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return books.filter(book => 
      book.title.toLowerCase().includes(lowercaseSearch) ||
      book.author.toLowerCase().includes(lowercaseSearch) ||
      book.isbn?.toLowerCase().includes(lowercaseSearch) ||
      book.grado?.toLowerCase().includes(lowercaseSearch)
    );
  }, [books, searchTerm]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll al inicio del grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-gray-200"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredBooks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {searchTerm ? 'No se encontraron libros' : 'No hay libros disponibles'}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {searchTerm 
            ? `No hay resultados para "${searchTerm}"`
            : 'No hay libros para mostrar en este momento'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contador de resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          {searchTerm && (
            <>
              Se encontraron <span className="font-medium">{filteredBooks.length}</span> libros
              {searchTerm && ` para "${searchTerm}"`}
            </>
          )}
        </p>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Vista:</label>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setItemsPerPage(8)}
              className={`px-3 py-1 text-xs font-medium rounded-l-md border ${
                itemsPerPage === 8
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Compacta
            </button>
            <button
              onClick={() => setItemsPerPage(12)}
              className={`px-3 py-1 text-xs font-medium border-t border-b ${
                itemsPerPage === 12
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setItemsPerPage(16)}
              className={`px-3 py-1 text-xs font-medium rounded-r-md border ${
                itemsPerPage === 16
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Amplia
            </button>
          </div>
        </div>
      </div>

      {/* Grid de libros */}
      <div className={`grid gap-4 transition-all duration-300 ${
        itemsPerPage === 8 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' :
        itemsPerPage === 12 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
      }`}>
        {currentBooks.map((book) => (
          <CompactBookCard
            key={book._id}
            book={book}
            onLoanRequest={onLoanRequest}
            onImageChange={onImageChange}
            canChangeImages={canChangeImages}
            loading={loading}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredBooks.length}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default PaginatedBookGrid;
