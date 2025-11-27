import React, { useState, useRef, useEffect } from 'react';
import { useCreateBook } from '../hooks/useCreateBook';
import type { Book } from '../api/books';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated?: () => void;
}

const initialForm: Partial<Omit<Book, '_id' | 'createdAt' | 'updatedAt' | 'isActive'>> = {
  title: '',
  author: '',
  isbn: '',
  genre: [] as string[],
  publishedYear: new Date().getFullYear(),
  description: '',
  language: 'es', // Cambiar a código ISO
  publisher: '',
  pages: 1,
  coverImage: '',
  estadoLibro: 'Bueno',
  grado: '',
};

const CreateBookModal: React.FC<CreateBookModalProps> = ({ isOpen, onClose, onBookCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [initialCopies, setInitialCopies] = useState(1);
  const [authors, setAuthors] = useState<string[]>(['']);
  const { createBook, loading, error, success } = useCreateBook();

  // Cerrar modal automáticamente después del éxito
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setForm(initialForm);
        setAuthors(['']);
        setCoverPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
      }, 2000); // Mostrar mensaje por 2 segundos

      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Funciones para manejar múltiples autores
  const handleAuthorChange = (index: number, value: string) => {
    const updatedAuthors = [...authors];
    updatedAuthors[index] = value;
    setAuthors(updatedAuthors);
  };

  const addAuthor = () => {
    setAuthors([...authors, '']);
  };

  const removeAuthor = (index: number) => {
    if (authors.length > 1) {
      const updatedAuthors = authors.filter((_, i) => i !== index);
      setAuthors(updatedAuthors);
    }
  };

  // Manejar selección de imagen (solo preview, no procesamiento)
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen.');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.');
      return;
    }

    // Guardar el archivo para envío
    setSelectedFile(file);

    // Crear preview para mostrar al usuario
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear FormData para enviar archivo + datos
    const formData = new FormData();
    
    // Combinar autores en un solo string separado por comas
    const combinedAuthors = authors.filter(author => author.trim() !== '').join(', ');
    
    // Agregar todos los campos del formulario
    formData.append('title', form.title || '');
    formData.append('author', combinedAuthors);
    formData.append('isbn', form.isbn || '');
    formData.append('genre', JSON.stringify(form.genre || []));
    formData.append('publishedYear', (form.publishedYear || new Date().getFullYear()).toString());
    formData.append('location', form.location || '');
    formData.append('description', form.description || '');
    formData.append('language', form.language || 'es');
    formData.append('publisher', form.publisher || '');
    formData.append('pages', (form.pages || 1).toString());
    formData.append('estadoLibro', form.estadoLibro || 'Bueno');
    formData.append('grado', form.grado || '');
    formData.append('initialCopies', initialCopies.toString());
    
    // Agregar imagen si existe
    if (selectedFile) {
      formData.append('coverImage', selectedFile);
    }

    try {
      // Enviar con FormData en lugar de JSON
      await createBook(formData);
      
      // Solo notificar creación, useEffect manejará el cierre
      if (onBookCreated) onBookCreated();
      
    } catch (err) {
      // El error se maneja en el hook useCreateBook
      console.error('Error al crear libro:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">📚 Nuevo Libro</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna 1: Información básica */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">📖 Información Básica</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input 
                      name="title" 
                      value={form.title} 
                      onChange={handleChange} 
                      required 
                      placeholder="Ingresa el título del libro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Autores *</label>
                      <button
                        type="button"
                        onClick={addAuthor}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <span>+</span>
                        <span>Agregar autor</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {authors.map((author, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={author}
                            onChange={(e) => handleAuthorChange(index, e.target.value)}
                            placeholder={index === 0 ? "Autor principal" : "Autor adicional"}
                            required={index === 0}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {authors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAuthor(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Eliminar autor"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      📝 Añade múltiples autores si es necesario
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ISBN *</label>
                    <input 
                      name="isbn" 
                      value={form.isbn} 
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
                      value={form.genre} 
                      onChange={handleChange} 
                      placeholder="Ej: Matemáticas, Ciencias Sociales, Literatura..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">📋 Detalles de Publicación</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año de Publicación *</label>
                    <input 
                      name="publishedYear" 
                      type="number" 
                      value={form.publishedYear} 
                      onChange={handleChange} 
                      required 
                      min="1800"
                      max={new Date().getFullYear() + 5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Editorial</label>
                    <input 
                      name="publisher" 
                      value={form.publisher} 
                      onChange={handleChange} 
                      placeholder="Nombre de la editorial"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Páginas</label>
                    <input 
                      name="pages" 
                      type="number" 
                      value={form.pages} 
                      onChange={handleChange} 
                      min={1} 
                      placeholder="Número de páginas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                    <select 
                      name="language" 
                      value={form.language} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                      <option value="fr">Francés</option>
                      <option value="pt">Portugués</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">🏷️ Catalogación</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input 
                      name="location" 
                      value={form.location} 
                      onChange={handleChange} 
                      placeholder="Ej: Estante A-3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                    <input 
                      name="grado" 
                      value={form.grado} 
                      onChange={handleChange} 
                      placeholder="Ej: 1°, 2°..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select 
                      name="estadoLibro" 
                      value={form.estadoLibro} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Bueno">✅ Bueno</option>
                      <option value="Regular">⚠️ Regular</option>
                      <option value="Malo">❌ Malo</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Copias Iniciales</label>
                  <input 
                    name="initialCopies" 
                    type="number" 
                    value={initialCopies} 
                    onChange={e => setInitialCopies(Number(e.target.value))} 
                    min={1} 
                    className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    placeholder="Breve descripción del libro..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Columna 2: Portada */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">🖼️ Portada del Libro</h3>
                
                <div className="space-y-4">
                  {/* Área de selección de archivo */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleCoverChange}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label 
                      htmlFor="cover-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-blue-600">
                          <span className="font-semibold">Clic para subir</span>
                        </p>
                        <p className="text-xs text-blue-500">PNG, JPG (MAX. 5MB)</p>
                      </div>
                    </label>
                  </div>

                  {/* Vista previa de la imagen */}
                  {coverPreview && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative">
                        <img
                          src={coverPreview}
                          alt="Previsualización de portada"
                          className="w-[192px] h-[270px] object-contain bg-gray-100 rounded-lg shadow-md border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverPreview(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Imagen optimizada: 192×270px (formato libro)<br/>
                        📸 Se conserva la proporción original sin recorte
                      </p>
                    </div>
                  )}

                  {!coverPreview && (
                    <div className="text-center py-4">
                      <div className="w-[192px] h-[270px] mx-auto bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Sin portada</p>
                          <p className="text-xs">192×270px</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <span>📚</span>
                    <span>Crear Libro</span>
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      ¡Libro creado exitosamente! 📚
                    </h3>
                    <p className="text-xs text-green-600 mt-1">
                      Cerrando automáticamente en 2 segundos...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBookModal;
