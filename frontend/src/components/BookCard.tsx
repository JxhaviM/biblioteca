import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import type { Book } from '../api/books';
import { buildMediaUrl } from '../config/api';

const BookCard: React.FC<{ 
  book: Book; 
  user?: any; 
  onLoanRequest?: (bookId: string) => void;
  onImageChange?: (bookId: string, file: File) => void;
  canChangeImage?: boolean;
  onManageCopies?: (book: Book) => void;
}> = ({ book, user, onLoanRequest, onImageChange, canChangeImage, onManageCopies }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAvailable = book.availability?.availableCopies > 0;
  const statusClasses = isAvailable
    ? 'bg-green-600 text-white'
    : 'bg-red-500 text-white';

  const handleImageClick = () => {
    if (canChangeImage && onImageChange) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(book._id, file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Debug para BookCard
  console.log('📸 BookCard - Debug:', {
    bookId: book._id,
    bookTitle: book.title,
    canChangeImage,
    hasOnImageChange: !!onImageChange
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105">
      <div 
        className={`w-full h-64 bg-gray-100 flex items-center justify-center relative ${canChangeImage ? 'cursor-pointer group' : ''}`}
        onClick={handleImageClick}
      >
        <img
          className="max-w-full max-h-full object-contain"
          src={book.coverImage ? buildMediaUrl(book.coverImage) : 'https://placehold.co/192x270/E5E7EB/1F2937?text=Libro'}
          alt={book.title}
        />
        
        {/* Icono de cámara para cambiar imagen */}
        {canChangeImage && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 rounded-full p-3 shadow-xl">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {/* Texto de ayuda */}
            <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              Cambiar imagen
            </div>
          </div>
        )}
        
        {/* Input oculto para seleccionar archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      <div className="p-4">
        {/* Indicador de permiso para cambiar imagen */}
        {canChangeImage && (
          <div className="flex items-center justify-center mb-2">
            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center">
              <Camera className="h-3 w-3 mr-1" />
              Puede cambiar imagen
            </div>
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-800">{book.title}</h3>
        <p className="text-sm text-gray-600 mt-1">Autor: {book.author}</p>
        <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
        {book.genre && (
          <p className="text-sm text-gray-600">
            Género: {Array.isArray(book.genre) ? book.genre.join(', ') : book.genre}
          </p>
        )}
        {book.publishedYear && (
          <p className="text-sm text-gray-600">Año: {book.publishedYear}</p>
        )}
        <div className="mt-4">
          <span className={`px-3 py-1 text-sm rounded-full font-semibold ${statusClasses}`}>
            {isAvailable ? 'Disponible' : 'No disponible'}
          </span>
          {book.availability && (
            <p className="text-xs text-gray-500 mt-1">
              {book.availability.availableCopies} de {book.availability.totalCopies} disponibles
            </p>
          )}
          
          {/* Botón de solicitud de préstamo */}
          {user && onLoanRequest && book.isActive && isAvailable && (
            <button
              onClick={() => onLoanRequest(book._id)}
              className="w-full mt-3 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              📚 Solicitar Préstamo
            </button>
          )}
          
          {user && !book.isActive && (
            <button disabled className="w-full mt-3 bg-gray-300 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
              ❌ Libro inactivo
            </button>
          )}
          
          {user && book.isActive && !isAvailable && (
            <button disabled className="w-full mt-3 bg-gray-300 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
              ❌ Sin copias disponibles
            </button>
          )}

          {/* Botón de gestión de copias para admin */}
          {user && (user.role === 'admin' || user.role === 'superadmin') && onManageCopies && (
            <button
              onClick={() => onManageCopies(book)}
              className="w-full mt-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              📋 Gestionar Copias
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
