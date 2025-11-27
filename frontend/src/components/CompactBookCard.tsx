import React, { useState, useEffect } from 'react';
import type { Book } from '../api/books';
import { buildMediaUrl } from '../config/api';

interface CompactBookCardProps {
  book: Book;
  onLoanRequest?: (bookId: string) => void;
  onImageChange?: (bookId: string, file: File) => void;
  canChangeImages?: boolean;
  loading?: boolean;
}

const CompactBookCard: React.FC<CompactBookCardProps> = ({ 
  book, 
  onLoanRequest, 
  onImageChange, 
  canChangeImages,
  loading = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!book.coverImage);

  // Resetear estados cuando cambia el libro
  useEffect(() => {
    setImageError(false);
    setImageLoading(!!book.coverImage);
  }, [book.coverImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(book._id, file);
    }
  };

  const getBookStatusColor = () => {
    if (!book.isActive) return 'bg-gray-100 text-gray-600';
    if (book.availability?.availableCopies > 0) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const getBookStatusText = () => {
    if (!book.isActive) return 'Inactivo';
    if (book.availability?.availableCopies > 0) return `${book.availability.availableCopies} disponibles`;
    return 'No disponible';
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden">
      {/* Imagen del libro */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {book.coverImage && !imageError ? (
          <img
            src={buildMediaUrl(book.coverImage)}
            alt={book.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center p-4">
              <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-xs text-blue-600 font-medium">Sin imagen</p>
            </div>
          </div>
        )}

        {/* Overlay para acciones */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-2">
            {onLoanRequest && book.isActive && book.availability?.availableCopies > 0 && (
              <button
                onClick={() => onLoanRequest(book._id)}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Solicitar
              </button>
            )}
            
            {canChangeImages && onImageChange && (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors cursor-pointer inline-block">
                  Cambiar imagen
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Indicador de carga */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Información del libro */}
      <div className="p-3">
        <div className="space-y-2">
          {/* Título */}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight" title={book.title}>
            {book.title}
          </h3>

          {/* Autor */}
          <p className="text-xs text-gray-600 line-clamp-1" title={book.author}>
            {book.author}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs">
            {book.isbn && (
              <span className="text-gray-500 font-mono" title={`ISBN: ${book.isbn}`}>
                {book.isbn.slice(-8)}
              </span>
            )}
            
            {book.grado && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                {book.grado}
              </span>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBookStatusColor()}`}>
              {getBookStatusText()}
            </span>
            
            {book.availability?.totalCopies > 0 && (
              <span className="text-xs text-gray-500">
                {book.availability.availableCopies}/{book.availability.totalCopies}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactBookCard;
