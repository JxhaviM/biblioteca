import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';

interface BulkUploadBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadResult {
  success: boolean;
  message: string;
  stats?: {
    totalLibros: number;
    filasProcessadas: number;
    exitos: number;
    errores: number;
  };
  librosCreados?: Array<{
    titulo: string;
    isbn: string;
    copia: number;
    totalCopias: number;
  }>;
  errores?: Array<{
    fila: number;
    error: string;
  }>;
}

const BulkUploadBooksModal: React.FC<BulkUploadBooksModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validar extensión
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedExtensions.includes(extension)) {
        setError('Solo se permiten archivos Excel (.xlsx, .xls) o CSV');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/books/upload-excel'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar el archivo');
      }

      setResult(data);
      
      if (data.success && onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📚</span>
              <div>
                <h2 className="text-xl font-bold">Carga Masiva de Libros</h2>
                <p className="text-sm text-green-100">Importar desde Excel o CSV</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instrucciones */}
          {!result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">📋 Formato del archivo Excel:</p>
                <ul className="text-xs text-blue-700 space-y-1 ml-4">
                  <li>• <strong>Cantidad:</strong> Número de copias (cada una será un libro individual)</li>
                  <li>• <strong>Título:</strong> Nombre del libro</li>
                  <li>• <strong>Autor:</strong> Nombre del autor (puede tener comas)</li>
                  <li>• <strong>Editorial:</strong> Casa editorial</li>
                  <li>• <strong>Año de publicación:</strong> Año (número)</li>
                  <li>• <strong>ISBN:</strong> Código ISBN (se generará uno único por copia)</li>
                  <li>• <strong>Estado de conservación:</strong> Bueno, Regular o Malo</li>
                  <li>• <strong>Formato:</strong> Tipo de formato del libro</li>
                  <li>• <strong>Area:</strong> Áreas separadas por comas (máx. 5)</li>
                  <li>• <strong>Grado:</strong> Grado escolar recomendado</li>
                  <li>• <strong>Ubicación:</strong> Ubicaciones separadas por comas</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Importante:</p>
                <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                  <li>• Si "Cantidad" es 3, se crearán 3 libros individuales</li>
                  <li>• Cada libro tendrá un ISBN único (original + sufijo)</li>
                  <li>• Los campos pueden tener múltiples valores separados por comas</li>
                  <li>• El archivo debe tener encabezados en la primera fila</li>
                </ul>
              </div>

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo Excel o CSV
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    📄 Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          )}

          {/* Resultados */}
          {result && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 mb-2">✅ Carga completada exitosamente</p>
                    <p className="text-xs text-green-700">{result.message}</p>
                  </div>

                  {result.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{result.stats.totalLibros}</p>
                        <p className="text-xs text-blue-700">Libros Creados</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{result.stats.filasProcessadas}</p>
                        <p className="text-xs text-purple-700">Filas Excel</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{result.stats.exitos}</p>
                        <p className="text-xs text-green-700">Exitosos</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">{result.stats.errores}</p>
                        <p className="text-xs text-red-700">Errores</p>
                      </div>
                    </div>
                  )}

                  {result.librosCreados && result.librosCreados.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-800 mb-3">📖 Primeros libros creados:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.librosCreados.map((libro, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border text-xs">
                            <p className="font-medium text-gray-900">{libro.titulo}</p>
                            <p className="text-gray-600">ISBN: {libro.isbn}</p>
                            <p className="text-gray-500">Copia {libro.copia} de {libro.totalCopias}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.errores && result.errores.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800 mb-3">⚠️ Errores encontrados:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.errores.map((err, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border border-red-200 text-xs">
                            <p className="font-medium text-red-900">Fila {err.fila}</p>
                            <p className="text-red-700">{err.error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{result.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t">
            {!result ? (
              <>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-md hover:from-green-600 hover:to-teal-700 disabled:opacity-50 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </div>
                  ) : (
                    '📤 Subir y Procesar'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadBooksModal;
