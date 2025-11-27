import React, { useEffect } from 'react';
import type { Book } from '../api/books';
import { buildMediaUrl } from '../config/api';

interface BookTableProps {
  books: Book[];
  loading: boolean;
  onEdit: (id: string) => void;
  onManageCopies?: (book: Book) => void;
}

const BookTable: React.FC<BookTableProps> = ({ books, loading, onEdit, onManageCopies }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando libros...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Wrapper con scroll horizontal visible */}
      <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12 sticky left-0 bg-gray-50">📷</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-12 bg-gray-50 min-w-[200px]">Libro</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">ISBN</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Grado</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">Copias</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Estado</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24 sticky right-0 bg-gray-50">⚙️</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {books.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg font-medium text-gray-400 mb-1">No hay libros registrados</p>
                    <p className="text-sm text-gray-400">Comienza agregando tu primer libro</p>
                  </div>
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                  {/* Portada - sticky left */}
                  <td className="px-2 py-2 sticky left-0 bg-white hover:bg-gray-50">
                    <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {book.coverImage ? (
                        <img 
                          src={buildMediaUrl(book.coverImage)}
                          alt={`Portada de ${book.title}`}
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('✅ Imagen cargada correctamente:', book.title);
                          }}
                          onError={(e) => {
                            console.log('❌ Error cargando imagen:', book.title);
                            console.log('📸 URL de imagen:', buildMediaUrl(book.coverImage));
                            console.log('🔗 coverImage raw:', book.coverImage);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const svgElement = target.parentElement?.querySelector('svg');
                            if (svgElement) {
                              svgElement.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Sin imagen</span>
                      )}
                      <svg 
                        className={`w-6 h-6 text-gray-400 ${book.coverImage ? 'hidden' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </td>
                  
                  {/* Info del libro - sticky left, compacta */}
                  <td className="px-2 py-2 sticky left-12 bg-white hover:bg-gray-50">
                    <div className="min-w-[200px] max-w-[300px]">
                      <p className="text-sm font-semibold text-gray-900 truncate" title={book.title}>{book.title}</p>
                      <p className="text-xs text-gray-600 truncate" title={book.author}>✍️ {book.author}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.publisher && (
                          <span className="text-xs text-gray-500">📚 {book.publisher}</span>
                        )}
                        {book.publishedYear && (
                          <span className="text-xs text-gray-500">📅 {book.publishedYear}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.location && (
                          <span className="text-xs text-gray-500">📍 {book.location}</span>
                        )}
                        {book.genre && Array.isArray(book.genre) && book.genre.length > 0 && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-1 rounded">{book.genre[0]}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* ISBN */}
                  <td className="px-2 py-2">
                    <p className="text-xs text-gray-900 font-mono whitespace-nowrap">{book.isbn}</p>
                  </td>
                  
                  {/* Grado */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-sm font-medium text-gray-900">{book.grado || '-'}</span>
                  </td>
                  
                  {/* Copias/Disponibilidad */}
                  <td className="px-2 py-2 text-center">
                    {book.availability ? (
                      <div>
                        <div className={`text-base font-bold ${
                          book.availability.isAvailable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {book.availability.availableCopies}/{book.availability.totalCopies}
                        </div>
                        <div className="text-xs text-gray-500">
                          {book.availability.isAvailable ? '✅ Disp' : '❌ No disp'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Estado */}
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      book.estadoLibro === 'Bueno' ? 'bg-blue-100 text-blue-800' :
                      book.estadoLibro === 'Regular' ? 'bg-yellow-100 text-yellow-800' :
                      book.estadoLibro === 'Malo' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {book.estadoLibro || 'Bueno'}
                    </span>
                  </td>
                  
                  {/* Acciones - sticky right */}
                  <td className="px-2 py-2 sticky right-0 bg-white hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      {onManageCopies && (
                        <button
                          onClick={() => onManageCopies(book)}
                          className="text-purple-600 hover:text-purple-800 transition-colors p-1 rounded hover:bg-purple-50"
                          title="Gestionar copias"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(book._id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Editar libro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookTable;