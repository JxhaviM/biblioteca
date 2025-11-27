import React, { useState } from 'react';
import { createBackup } from '../api/system';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<any>(null);

  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createBackup();
      setBackupData(response.backup);
      
      // Descargar el backup como JSON
      const dataStr = JSON.stringify(response.backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ Backup creado y descargado exitosamente!');
    } catch (err: any) {
      console.error('Error al crear backup:', err);
      setError(err.message || 'Error al crear el backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">💾</span>
              <div>
                <h2 className="text-xl font-bold">Backup de Base de Datos</h2>
                <p className="text-sm text-red-100">Crear respaldo completo del sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {backupData ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-2">✅ Backup completado exitosamente</p>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>Fecha:</strong> {new Date(backupData.metadata.fecha).toLocaleString()}</p>
                  <p><strong>Generado por:</strong> {backupData.metadata.generadoPor}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-3">📊 Registros incluidos:</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-600 text-xs">Usuarios</p>
                    <p className="text-2xl font-bold text-blue-600">{backupData.metadata.totalRegistros.usuarios}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-600 text-xs">Personas</p>
                    <p className="text-2xl font-bold text-green-600">{backupData.metadata.totalRegistros.personas}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-600 text-xs">Préstamos</p>
                    <p className="text-2xl font-bold text-purple-600">{backupData.metadata.totalRegistros.prestamos}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <p className="text-gray-600 text-xs">Logs</p>
                    <p className="text-2xl font-bold text-orange-600">{backupData.metadata.totalRegistros.logs}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Importante:</strong>
                </p>
                <ul className="text-xs text-yellow-700 mt-2 space-y-1 ml-4">
                  <li>• Se creará un archivo JSON con toda la información del sistema</li>
                  <li>• Incluye: Usuarios, Personas, Préstamos y Logs</li>
                  <li>• El archivo se descargará automáticamente</li>
                  <li>• Guárdalo en un lugar seguro</li>
                  <li>• Se recomienda hacer backups periódicos</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  <strong>ℹ️ Información:</strong> Este backup incluye todos los datos necesarios para 
                  restaurar el sistema en caso de pérdida de información. Mantén estos archivos en un 
                  lugar seguro y accesible solo para administradores.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md hover:from-red-600 hover:to-pink-600 disabled:opacity-50 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </div>
                  ) : (
                    '💾 Crear Backup'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupModal;
