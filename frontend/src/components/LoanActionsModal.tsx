import React, { useState } from 'react';
import type { Loan } from '../api/loans';
import type { User } from '../api/auth';

interface LoanActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  user: User | null;
  onActionComplete: () => void;
}

const LoanActionsModal: React.FC<LoanActionsModalProps> = ({
  isOpen,
  onClose,
  loan,
  user,
  onActionComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [extendDays, setExtendDays] = useState('7');

  if (!isOpen || !loan) return null;

  const handleApprove = async () => {
    if (!confirm('¿Estás seguro de que deseas aprobar este préstamo?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/loans/${loan._id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Préstamo aprobado exitosamente');
        onActionComplete();
        onClose();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error aprobando préstamo:', error);
      alert('Error al aprobar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('¿Cuál es el motivo del rechazo?');
    if (!reason) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/loans/${loan._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (data.success) {
        alert('Préstamo rechazado exitosamente');
        onActionComplete();
        onClose();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error rechazando préstamo:', error);
      alert('Error al rechazar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!confirm('¿Estás seguro de que deseas registrar la devolución de este libro?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/loans/${loan._id}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Libro devuelto exitosamente');
        onActionComplete();
        onClose();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error devolviendo libro:', error);
      alert('Error al devolver el libro');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    const days = parseInt(extendDays);
    if (isNaN(days) || days <= 0) {
      alert('Por favor ingrese un número válido de días');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/loans/${loan._id}/renew`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          additionalDays: days,
          reason: 'Extensión solicitada por administrador'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Préstamo extendido ${days} días exitosamente`);
        onActionComplete();
        onClose();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error extendiendo préstamo:', error);
      alert('Error al extender el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'prestado': return 'bg-blue-100 text-blue-800';
      case 'atrasado': return 'bg-red-100 text-red-800';
      case 'devuelto': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Debug: mostrar estado del préstamo
  console.log('🔍 LoanActionsModal - Estado del préstamo:', loan.status);
  console.log('🔍 LoanActionsModal - Préstamo completo:', loan);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Acciones del Préstamo</h2>
              <p className="text-blue-100">Gestionar préstamo de: {loan.bookId?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loan Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-3">Detalles del Préstamo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Libro:</span>
                <p className="text-gray-700">{loan.bookId?.title}</p>
                <p className="text-gray-500">por {loan.bookId?.author}</p>
              </div>
              <div>
                <span className="font-medium">Usuario:</span>
                <p className="text-gray-700">{(loan as any).userId?.username || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium">Fecha Préstamo:</span>
                <p className="text-gray-700">
                  {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('es-CO') : 'Por definir'}
                </p>
              </div>
              <div>
                <span className="font-medium">Fecha Devolución:</span>
                <p className="text-gray-700">
                  {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('es-CO') : 'Por definir'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Estado:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                  {loan.status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Acciones Disponibles</h3>
            
            {loan.status === 'pendiente' && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : '✅ Aprobar Préstamo'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : '❌ Rechazar Préstamo'}
                </button>
              </div>
            )}

            {(loan.status === 'prestado' || loan.status === 'atrasado') && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleReturn}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : '📚 Registrar Devolución'}
                  </button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Extender Préstamo</h4>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      placeholder="Días"
                      min="1"
                      max="30"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleExtend}
                      disabled={loading}
                      className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Procesando...' : '⏰ Extender'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loan.status === 'devuelto' && (
              <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600">
                ✅ Este préstamo ya ha sido devuelto
              </div>
            )}

            {/* Opción por defecto para cualquier otro estado */}
            {!['pendiente', 'prestado', 'atrasado', 'devuelto'].includes(loan.status) && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Estado no reconocido:</strong> {loan.status}
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Contacta al administrador para gestionar este préstamo
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Forzar Aprobación
                  </button>
                  <button
                    onClick={handleReturn}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Forzar Devolución
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanActionsModal;
