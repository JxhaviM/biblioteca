import React from 'react';
import BookCard from './BookCard';
import type { Book } from '../api/books';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  user?: any;
  onLoanRequest?: (bookId: string) => void;
  onImageChange?: (bookId: string, file: File) => void;
  canChangeImages?: boolean;
  onManageCopies?: (book: Book) => void;
}

const BookGrid: React.FC<BookGridProps> = ({ books, loading = false, user, onLoanRequest, onImageChange, canChangeImages, onManageCopies }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-64 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No hay libros disponibles
        </h3>
        <p className="text-gray-500">
          {user ? 'No hay libros en el catálogo en este momento.' : 'Inicia sesión para ver el catálogo completo.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard 
          key={book._id} 
          book={book} 
          user={user}
          onLoanRequest={onLoanRequest}
          onImageChange={onImageChange}
          canChangeImage={canChangeImages}
          onManageCopies={onManageCopies}
        />
      ))}
    </div>
  );
};

export default BookGrid;
