import React, { useState, useEffect } from 'react';
import type { Loan } from '../api/loans';
import { buildApiUrl } from '../config/api';
import CreateLoanModal from '../components/CreateLoanModal';
import LoanActionsModal from '../components/LoanActionsModal';
import { useUserContext } from '../contexts/UserContext';
import type { User, Person } from '../api/auth';

interface LoansPageProps {
  user: User | null;
  person: Person | null;
}

const LoansPage: React.FC<LoansPageProps> = ({ user, person }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('active');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  useEffect(() => {
    fetchLoans();
    if (isAdmin) {
      fetchPendingCount();
    }
  }, [activeTab, user]);

  const fetchPendingCount = async () => {
    if (!isAdmin) return;
    
    try {
      console.log('🔍 Fetching pending count - isAdmin:', isAdmin);
      const token = localStorage.getItem('token');
      console.log('🔍 Token exists:', !!token);
      const response = await fetch(buildApiUrl('/loans/pending-count'), {
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      });
      const data = await response.json();
      console.log('🔍 Pending count response:', data);
      if (data.success) {
        setPendingCount(data.data || 0);
        console.log('🔍 Pending count set to:', data.data || 0);
      } else {
        console.error('🔍 Error in pending count:', data.message);
      }
    } catch (e) {
      console.error('🔍 Error obteniendo conteo de pendientes:', e);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '/loans?';
      
      if (activeTab === 'pending') {
        url += 'status=pendiente';
      } else if (activeTab === 'active') {
        url += 'status=prestado,atrasado'; // Préstamos activos incluyendo atrasados
      } else {
        url += 'status=devuelto'; // Historial de devueltos
      }

      const response = await fetch(buildApiUrl(url), {
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      });

      const data = await response.json();
      if (data.success) {
        setLoans(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando prestamos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId: string, days: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/loans/' + loanId + '/approve'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ days })
      });

      const data = await response.json();
      if (data.success) {
        alert('Solicitud aprobada exitosamente');
        fetchLoans();
        fetchPendingCount();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error aprobando prestamo:', error);
      alert('Error al aprobar la solicitud');
    }
  };

  const handleReject = async (loanId: string) => {
    const reason = prompt('Motivo del rechazo (opcional):') || '';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/loans/' + loanId + '/reject'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (data.success) {
        alert('Solicitud rechazada');
        fetchLoans();
        fetchPendingCount();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error rechazando prestamo:', error);
    }
  };

  const handleReturn = async (loanId: string) => {
    if (!confirm('Confirmar devolucion del libro?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/loans/' + loanId + '/return'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Libro devuelto exitosamente');
        fetchLoans();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error devolviendo libro:', error);
    }
  };

  const handleExtend = async (loanId: string) => {
    const additionalDays = prompt('¿Cuántos días desea extender el préstamo?', '7');
    if (!additionalDays) return;
    
    const days = parseInt(additionalDays);
    if (isNaN(days) || days <= 0) {
      alert('Por favor ingrese un número válido de días');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/loans/' + loanId + '/renew'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ 
          additionalDays: days,
          reason: 'Extensión solicitada por administrador'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Préstamo extendido ${days} días exitosamente`);
        fetchLoans();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error extendiendo préstamo:', error);
    }
  };

  const handleOpenActionsModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowActionsModal(true);
  };

  const handleCloseActionsModal = () => {
    setShowActionsModal(false);
    setSelectedLoan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Prestamos</h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nuevo Prestamo
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
          )}
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando prestamos...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-400">No hay prestamos</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Prestamo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Devolucion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr 
                  key={loan._id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenActionsModal(loan)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {(loan as any).bookId?.title || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(loan as any).bookId?.author || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {(loan as any).studentId?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {(loan as any).studentId?.idNumber || 'N/A'}
                    </div>
                    {(loan as any).studentId?.grade && (
                      <div className="text-sm text-gray-500">
                        Grado: {(loan as any).studentId?.grade}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('es-CO') : 'Por definir'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('es-CO') : 'Por definir'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (loan as any).status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      (loan as any).status === 'prestado' || (loan as any).status === 'atrasado' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {(loan as any).status || 'N/A'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm font-medium">
                      {(loan as any).status === 'pendiente' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(loan._id, 15);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(loan._id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (loan as any).status === 'prestado' || (loan as any).status === 'atrasado' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReturn(loan._id);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Devolver
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtend(loan._id);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Extender
                          </button>
                        </div>
                      ) : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de acciones del préstamo */}
      <LoanActionsModal
        isOpen={showActionsModal}
        onClose={handleCloseActionsModal}
        loan={selectedLoan}
        user={user}
        onActionComplete={() => {
          fetchLoans();
          if (isAdmin) {
            fetchPendingCount();
          }
        }}
      />

      {/* Modal de creación de préstamo */}
      {showCreateModal && (
        <CreateLoanModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLoans();
            if (isAdmin) {
              fetchPendingCount();
            }
          }}
        />
      )}
    </div>
  );
};

export default LoansPage;
