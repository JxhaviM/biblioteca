import React, { useState, useEffect } from 'react';
import type { Loan } from '../api/loans';
import type { User } from '../api/auth';
import loansApi from '../api/loans';

interface LoansSectionProps {
  user: User;
  userLoans: Loan[];
  onRefresh: () => void;
}

const LoansSection: React.FC<LoansSectionProps> = ({ user, userLoans, onRefresh }) => {
  const [activeSection, setActiveSection] = useState<'active' | 'requests' | 'history'>('active');
  const [loading, setLoading] = useState(false);

  // Filtrar préstamos por estado
  const activeLoans = userLoans.filter(loan => 
    !loan.returnDate && 
    (loan.status === 'prestado' || loan.status === 'atrasado') && 
    loan.isBorrowed === true
  );
  
  const pendingRequests = userLoans.filter(loan => 
    loan.status === 'pendiente'
  );

  // Para admin: también mostrar préstamos que fueron creados por admin pero necesitan aprobación final
  const adminPendingApprovals = userLoans.filter(loan => 
    (user?.role === 'admin' || user?.role === 'superadmin') &&
    (loan.status === 'prestado' && !loan.isBorrowed) // Préstamos creados pero no activos
  );
  
  const loanHistory = userLoans.filter(loan => 
    loan.returnDate || 
    loan.status === 'devuelto' ||
    loan.status === 'cancelado' ||
    (loan.status === 'prestado' && !loan.isBorrowed)
  );

  // Debug: mostrar préstamos y sus estados
  console.log('🔍 LoansSection - Usuario:', user?.username, 'Rol:', user?.role);
  console.log('🔍 LoansSection - Todos los préstamos:', userLoans.map(l => ({ id: l._id, status: l.status, isBorrowed: l.isBorrowed, book: l.bookId?.title })));
  console.log('🔍 LoansSection - Préstamos pendientes:', pendingRequests.length);
  console.log('🔍 LoansSection - Préstamos activos:', activeLoans.length);
  console.log('🔍 LoansSection - Admin pendientes de aprobación:', adminPendingApprovals.length);
  console.log('🔍 LoansSection - Historial:', loanHistory.length);

  // Función para cancelar solicitud
  const handleCancelRequest = async (loanId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
      return;
    }

    try {
      setLoading(true);
      await loansApi.updateLoan(loanId, { status: 'cancelado' });
      console.log('🔄 Recargando préstamos después de cancelar solicitud...');
      await onRefresh(); // Recargar préstamos
    } catch (error) {
      console.error('Error cancelando solicitud:', error);
      alert('Error al cancelar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar solicitud
  const handleApproveRequest = async (loanId: string) => {
    if (!confirm('¿Estás seguro de que deseas aprobar esta solicitud de préstamo?')) {
      return;
    }

    try {
      setLoading(true);
      await loansApi.approveLoan(loanId);
      console.log('🔄 Recargando préstamos después de aprobar solicitud...');
      await onRefresh(); // Recargar préstamos
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      alert('Error al aprobar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Función para devolver libro
  const handleReturnBook = async (loanId: string) => {
    if (!confirm('¿Estás seguro de que deseas devolver este libro?')) {
      return;
    }

    try {
      setLoading(true);
      await loansApi.returnBook(loanId);
      onRefresh(); // Recargar préstamos
    } catch (error) {
      console.error('Error devolviendo libro:', error);
      alert('Error al devolver el libro');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (loan: Loan) => {
    if (loan.returnDate) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Devuelto</span>;
    }
    
    if (loan.status === 'pendiente') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Pendiente</span>;
    }
    
    if (loan.status === 'cancelado') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">❌ Cancelado</span>;
    }
    
    if (new Date(loan.dueDate) < new Date()) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">⚠️ Vencido</span>;
    }
    
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">📖 Activo</span>;
  };

  const LoanCard = ({ loan, showActions = true }: { loan: Loan; showActions?: boolean }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{loan.bookId?.title}</h4>
          <p className="text-sm text-gray-600 mb-3">por {loan.bookId?.author}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
            {/* Para solicitudes pendientes, mostrar fecha de solicitud */}
            {loan.status === 'pendiente' ? (
              <>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>Solicitud: {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'Pendiente por definir'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📋</span>
                  <span>Estado: Pendiente por aprobar</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>Préstamo: {loan.loanStartDate ? new Date(loan.loanStartDate).toLocaleDateString() : 'Por definir'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⏰</span>
                  <span>Devolución: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'Por definir'}</span>
                </div>
              </>
            )}
            {loan.bookId?.isbn && (
              <div className="flex items-center space-x-2">
                <span>📚</span>
                <span>ISBN: {loan.bookId.isbn}</span>
              </div>
            )}
            {loan.bookId?.grado && (
              <div className="flex items-center space-x-2">
                <span>🎓</span>
                <span>Grado: {loan.bookId.grado}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            {getStatusBadge(loan)}
          </div>
        </div>
        
        {showActions && (
          <div className="ml-4 flex flex-col space-y-2">
            {loan.status === 'pendiente' && (
              <>
                {/* Solo admin/superadmin pueden aprobar préstamos */}
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <button
                    onClick={() => handleApproveRequest(loan._id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    title="Aprobar préstamo"
                  >
                    Aprobar
                  </button>
                )}
                
                {/* Botón de cancelar siempre visible para solicitudes pendientes */}
                <button
                  onClick={() => handleCancelRequest(loan._id)}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            )}

            {/* Préstamos creados por admin pero no activos (necesitan aprobación final) */}
            {loan.status === 'prestado' && !loan.isBorrowed && (user.role === 'admin' || user.role === 'superadmin') && (
              <>
                <button
                  onClick={() => handleApproveRequest(loan._id)}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  title="Activar préstamo"
                >
                  Activar
                </button>
                <button
                  onClick={() => handleCancelRequest(loan._id)}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            )}
            
            {loan.status === 'prestado' && loan.isBorrowed && !loan.returnDate && (
              <button
                onClick={() => handleReturnBook(loan._id)}
                disabled={loading}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Devolver
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <span className="text-3xl">📖</span>
          <span>Mis Préstamos</span>
        </h2>
        
        {/* Pestañas internas */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveSection('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'active'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Préstamos Activos ({activeLoans.length})
            </button>
            <button
              onClick={() => setActiveSection('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'requests'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⏳ Solicitudes ({pendingRequests.length + adminPendingApprovals.length})
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'history'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📜 Historial ({loanHistory.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de las secciones */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Préstamos Activos */}
        {activeSection === 'active' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Préstamos Activos</h3>
            {activeLoans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes préstamos activos</h3>
                <p className="text-gray-500">Explora nuestro catálogo y solicita un libro</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <LoanCard key={loan._id} loan={loan} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Solicitudes Pendientes */}
        {activeSection === 'requests' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes Pendientes de Aprobación</h3>
            
            {/* Solicitudes de usuario */}
            {pendingRequests.length > 0 && (
              <>
                <h4 className="text-md font-medium text-gray-700 mb-3">📝 Mis Solicitudes</h4>
                <div className="space-y-4 mb-6">
                  {pendingRequests.map((loan) => (
                    <LoanCard key={loan._id} loan={loan} />
                  ))}
                </div>
              </>
            )}

            {/* Aprobaciones pendientes para admin */}
            {adminPendingApprovals.length > 0 && (
              <>
                <h4 className="text-md font-medium text-gray-700 mb-3">🔐 Pendientes de Aprobación (Admin)</h4>
                <div className="space-y-4">
                  {adminPendingApprovals.map((loan) => (
                    <LoanCard key={loan._id} loan={loan} />
                  ))}
                </div>
              </>
            )}

            {/* Si no hay nada */}
            {pendingRequests.length === 0 && adminPendingApprovals.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">⏳</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes solicitudes pendientes</h3>
                <p className="text-gray-500">Tus solicitudes aprobadas aparecerán en la sección de préstamos activos</p>
              </div>
            )}
          </div>
        )}

        {/* Historial */}
        {activeSection === 'history' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Préstamos</h3>
            {loanHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📜</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes historial de préstamos</h3>
                <p className="text-gray-500">Tus préstamos devueltos y vencidos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loanHistory.map((loan) => (
                  <LoanCard key={loan._id} loan={loan} showActions={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansSection;
