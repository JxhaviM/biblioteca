import React, { useState, useEffect, useRef } from 'react';
import type { Book } from '../api/books';
import { updateBook } from '../api/books';
import { buildMediaUrl } from '../config/api';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onBookUpdated?: () => void;
}

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  genre: string; // En el formulario manejamos como string
  publishedYear: number;
  location: string;
  description: string;
  language: string;
  publisher: string;
  pages: number;
  estadoLibro: string;
  grado: string;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ 
  isOpen, 
  onClose, 
  book, 
  onBookUpdated 
}) => {
  const [form, setForm] = useState<Partial<BookFormData>>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authors, setAuthors] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar datos del libro cuando se abre el modal
  useEffect(() => {
    if (book && isOpen) {
      console.log('📖 Cargando libro en el modal:', book);
      console.log('🏷️ Género del libro:', book.genre, 'Tipo:', typeof book.genre);
      
      setForm({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        genre: Array.isArray(book.genre) ? book.genre.join(', ') : book.genre || '',
        publishedYear: book.publishedYear || new Date().getFullYear(),
        location: book.location || '',
        description: book.description || '',
        language: book.language || 'es',
        publisher: book.publisher || '',
        pages: book.pages || 1,
        estadoLibro: book.estadoLibro || 'Bueno',
        grado: book.grado || '',
      });

      // Configurar autores
      if (book.author) {
        const authorList = book.author.split(',').map(a => a.trim());
        setAuthors(authorList.length > 0 ? authorList : ['']);
      }

      // Configurar preview de imagen actual
      if (book.coverImage) {
        setCoverPreview(buildMediaUrl(book.coverImage));
      } else {
        setCoverPreview(null);
      }
      
      setSelectedFile(null);
      setError('');
      setSuccess(false);
    }
  }, [book, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  const addAuthor = () => {
    setAuthors([...authors, '']);
  };

  const removeAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index));
    }
  };

  const updateAuthor = (index: number, value: string) => {
    const newAuthors = [...authors];
    newAuthors[index] = value;
    setAuthors(newAuthors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;

    setLoading(true);
    setError('');

    try {
      console.log('📝 === INICIO ACTUALIZACIÓN ===');
      console.log('🆔 Book ID:', book._id);
      console.log('📋 Form data:', form);
      console.log('👥 Authors:', authors);
      console.log('🖼️ Selected file:', selectedFile ? 'Sí' : 'No');

      if (selectedFile) {
        // Si hay archivo, usar FormData
        const formData = new FormData();
        
        // Agregar campos del formulario
        Object.entries(form).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            if (key === 'genre') {
              // Convertir género de string a array y enviar como string separado por comas
              const genreArray = value.toString().split(',').map(g => g.trim()).filter(g => g);
              formData.append(key, genreArray.join(', '));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        // Agregar autores
        const validAuthors = authors.filter(author => author.trim() !== '');
        if (validAuthors.length > 0) {
          formData.append('author', validAuthors.join(', '));
        }

        // Agregar archivo
        formData.append('coverImage', selectedFile);

        console.log('📦 Enviando FormData con archivo');
        const response = await updateBook(book._id, formData);
        
        if (response.success) {
          setSuccess(true);
          onBookUpdated?.();
          
          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(response.message || 'Error al actualizar el libro');
        }
      } else {
        // Si no hay archivo, usar JSON simple
        const updateData: Record<string, unknown> = {};
        
        // Agregar campos del formulario
        Object.entries(form).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            if (key === 'genre') {
              // Convertir género de string a array
              const genreArray = value.toString().split(',').map(g => g.trim()).filter(g => g);
              updateData[key] = genreArray;
            } else {
              updateData[key] = value;
            }
          }
        });

        // Agregar autores
        const validAuthors = authors.filter(author => author.trim() !== '');
        if (validAuthors.length > 0) {
          updateData.author = validAuthors.join(', ');
        }

        console.log('📤 Enviando JSON:', updateData);
        const response = await updateBook(book._id, updateData as Partial<Book>);
        
        if (response.success) {
          setSuccess(true);
          onBookUpdated?.();
          
          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(response.message || 'Error al actualizar el libro');
        }
      }
    } catch (err: unknown) {
      console.error('Error al actualizar libro:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el libro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Editar Libro</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700">¡Libro actualizado exitosamente!</p>
            </div>
          )}

          {/* Información Básica */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">📚 Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input 
                  name="title" 
                  value={form.title || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="Título del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Autores múltiples */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autores *</label>
                {authors.map((author, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input 
                      value={author}
                      onChange={(e) => updateAuthor(index, e.target.value)}
                      placeholder={'Autor ' + (index + 1)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {authors.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeAuthor(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addAuthor}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                >
                  + Agregar Autor
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
                <input 
                  name="isbn" 
                  value={form.isbn || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="Código ISBN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <input 
                  name="genre" 
                  value={form.genre || ''} 
                  onChange={handleChange} 
                  placeholder="Ej: Matemáticas, Ciencias Sociales, Literatura..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Detalles de Publicación */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">📋 Detalles de Publicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año de Publicación</label>
                <input 
                  name="publishedYear" 
                  type="number" 
                  value={form.publishedYear || ''} 
                  onChange={handleChange} 
                  min="1000" 
                  max={new Date().getFullYear() + 5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Editorial</label>
                <input 
                  name="publisher" 
                  value={form.publisher || ''} 
                  onChange={handleChange} 
                  placeholder="Editorial del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Páginas</label>
                <input 
                  name="pages" 
                  type="number" 
                  value={form.pages || ''} 
                  onChange={handleChange} 
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Información Administrativa */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🏫 Información Administrativa</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input 
                  name="location" 
                  value={form.location || ''} 
                  onChange={handleChange} 
                  placeholder="Ej: Estante A-3, Sección 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Libro</label>
                <select 
                  name="estadoLibro" 
                  value={form.estadoLibro || 'Bueno'} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Excelente">Excelente</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grado/Nivel</label>
                <input 
                  name="grado" 
                  value={form.grado || ''} 
                  onChange={handleChange} 
                  placeholder="Ej: 1°, 2°, Primaria, Secundaria"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Portada */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🎨 Portada del Libro</h3>
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar nueva imagen (opcional)
                </label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB. Se redimensionará a 192×270px.
                </p>
              </div>
              
              {coverPreview && (
                <div className="flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                  <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden border">
                    <img 
                      src={coverPreview} 
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              name="description" 
              value={form.description || ''} 
              onChange={handleChange} 
              rows={3}
              placeholder="Descripción breve del libro..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Actualizando...</span>
                </>
              ) : (
                <span>Actualizar Libro</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookModal;