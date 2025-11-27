import React, { useState } from 'react';
import { changePersonStatus } from '../api/persons';
import type { Person } from '../types';

interface ChangePersonStatusModalProps {
  isOpen: boolean;
  person: Person | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePersonStatusModal: React.FC<ChangePersonStatusModalProps> = ({
  isOpen,
  person,
  onClose,
  onSuccess
}) => {
  const [nuevoEstado, setNuevoEstado] = useState<'Activo' | 'Suspendido' | 'Vetado'>('Activo');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !person) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar que se requiere motivo para Suspender o Vetar
    if ((nuevoEstado === 'Suspendido' || nuevoEstado === 'Vetado') && !motivoEstado.trim()) {
      setError(`Debe proporcionar un motivo para ${nuevoEstado === 'Suspendido' ? 'suspender' : 'vetar'}`);
      return;
    }

    try {
      setLoading(true);
      await changePersonStatus(person._id, nuevoEstado, motivoEstado || undefined);
      alert(`Estado cambiado exitosamente a ${nuevoEstado}`);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('Error al cambiar el estado de la persona');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNuevoEstado('Activo');
    setMotivoEstado('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-xl font-bold">Cambiar Estado</h2>
                <p className="text-sm text-orange-100">
                  {person.nombre1} {person.apellido1}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Estado Actual */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Estado Actual:</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              person.estado === 'Activo' ? 'bg-green-100 text-green-800' :
              person.estado === 'Suspendido' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {person.estado}
            </span>
            {person.motivoEstado && (
              <p className="text-xs text-gray-600 mt-2">
                <strong>Motivo anterior:</strong> {person.motivoEstado}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Nuevo Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Estado <span className="text-red-500">*</span>
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value as 'Activo' | 'Suspendido' | 'Vetado')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="Activo">✅ Activo</option>
              <option value="Suspendido">⏸️ Suspendido</option>
              <option value="Vetado">🚫 Vetado</option>
            </select>
          </div>

          {/* Motivo (obligatorio para Suspender/Vetar) */}
          {(nuevoEstado === 'Suspendido' || nuevoEstado === 'Vetado') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoEstado}
                onChange={(e) => setMotivoEstado(e.target.value)}
                placeholder={`¿Por qué deseas ${nuevoEstado === 'Suspendido' ? 'suspender' : 'vetar'} a esta persona?`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 10 caracteres
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong>ℹ️ Información:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4">
              <li>• <strong>Activo:</strong> Puede acceder normalmente al sistema</li>
              <li>• <strong>Suspendido:</strong> Acceso temporalmente bloqueado</li>
              <li>• <strong>Vetado:</strong> Acceso permanentemente bloqueado y usuario desactivado</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                `Cambiar a ${nuevoEstado}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePersonStatusModal;
