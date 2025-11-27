import React, { useState, useEffect } from 'react';
import type { Book } from '../api/books';

interface BookCopy {
  _id: string;
  copyNumber: number;
  status: 'disponible' | 'prestado' | 'atrasado' | 'devuelto' | 'dañado' | 'perdido';
  isBorrowed: boolean;
  userId?: any;
  loanStartDate?: string;
  dueDate?: string;
  notes?: string;
}

interface BookCopiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onCopiesUpdated: () => void;
  userRole?: string;
}

const BookCopiesModal: React.FC<BookCopiesModalProps> = ({
  isOpen,
  onClose,
  book,
  onCopiesUpdated,
  userRole
}) => {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCopiesCount, setNewCopiesCount] = useState(1);
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'disponible',
    notes: ''
  });

  // Cargar copias del libro
  const loadCopies = async () => {
    if (!book) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/books/${book._id}/copies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCopies(data.copies || []);
      } else {
        console.error('Error cargando copias:', data.message);
      }
    } catch (error) {
      console.error('Error cargando copias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && book) {
      loadCopies();
    }
  }, [isOpen, book]);

  // Agregar nuevas copias
  const handleAddCopies = async () => {
    if (!book || newCopiesCount < 1) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas agregar ${newCopiesCount} copia(s) del libro "${book.title}"?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/books/${book._id}/copies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numberOfCopies: newCopiesCount
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${newCopiesCount} copia(s) agregada(s) exitosamente`);
        setNewCopiesCount(1);
        loadCopies();
        onCopiesUpdated();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error agregando copias:', error);
      alert('❌ Error al agregar copias');
    } finally {
      setLoading(false);
    }
  };

  // Editar copia
  const handleEditCopy = (copy: BookCopy) => {
    setEditingCopy(copy);
    setEditForm({
      status: copy.status,
      notes: copy.notes || ''
    });
  };

  // Guardar edición de copia
  const handleSaveEdit = async () => {
    if (!editingCopy) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas actualizar la copia #${editingCopy.copyNumber}?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/books/copies/${editingCopy._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Copia actualizada exitosamente');
        setEditingCopy(null);
        loadCopies();
        onCopiesUpdated();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error actualizando copia:', error);
      alert('❌ Error al actualizar copia');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar copia
  const handleDeleteCopy = async (copy: BookCopy) => {
    // Validar que solo superadmin puede eliminar copias
    if (userRole !== 'superadmin') {
      alert('❌ Solo los superadministradores pueden eliminar copias de libros');
      return;
    }

    if (copy.isBorrowed) {
      alert('❌ No se puede eliminar una copia que está prestada');
      return;
    }

    // Pedir confirmación
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la copia #${copy.copyNumber}?\n\nEsta acción dará de baja la copia del sistema.`
    );
    if (!confirmed) return;

    // Pedir motivo de baja (obligatorio)
    const motivo = prompt('Por favor, ingresa el motivo de la baja de esta copia:');
    if (!motivo || motivo.trim() === '') {
      alert('❌ Debes ingresar un motivo para dar de baja la copia');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/books/copies/${copy._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motivo: motivo.trim() })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Copia #${copy.copyNumber} eliminada exitosamente\n\nMotivo: ${motivo}`);
        loadCopies();
        onCopiesUpdated();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error eliminando copia:', error);
      alert('❌ Error al eliminar copia');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'prestado': return 'bg-blue-100 text-blue-800';
      case 'atrasado': return 'bg-red-100 text-red-800';
      case 'devuelto': return 'bg-gray-100 text-gray-800';
      case 'dañado': return 'bg-yellow-100 text-yellow-800';
      case 'perdido': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponible': return '🟢 Disponible';
      case 'prestado': return '🔵 Prestado Actualmente';
      case 'atrasado': return '🔴 Prestado (Atrasado)';
      case 'devuelto': return '⚪ Devuelto (Histórico)';
      case 'dañado': return '🟡 Dañado';
      case 'perdido': return '🟣 Perdido';
      default: return status;
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Gestionar Copias</h2>
              <p className="text-blue-100">Libro: {book.title} por {book.author}</p>
              <p className="text-blue-100 text-sm">ISBN: {book.isbn}</p>
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
          {/* Agregar nuevas copias */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-3">Agregar Nuevas Copias</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de copias a agregar
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newCopiesCount}
                  onChange={(e) => setNewCopiesCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddCopies}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Agregando...' : '➕ Agregar Copias'}
              </button>
            </div>
          </div>

          {/* Lista de copias */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-lg">
                Copias Existentes ({copies.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando copias...</p>
              </div>
            ) : copies.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No hay copias registradas para este libro</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {copies.map((copy) => (
                  <div key={copy._id} className="p-4 hover:bg-gray-50">
                    {editingCopy?._id === copy._id ? (
                      /* Modo edición */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Copia #{copy.copyNumber}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={loading}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              💾 Guardar
                            </button>
                            <button
                              onClick={() => setEditingCopy(null)}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="disponible">Disponible</option>
                              <option value="prestado">Prestado</option>
                              <option value="atrasado">Atrasado</option>
                              <option value="devuelto">Devuelto</option>
                              <option value="dañado">Dañado</option>
                              <option value="perdido">Perdido</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                            <input
                              type="text"
                              value={editForm.notes}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              placeholder="Notas adicionales..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Modo vista */
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium">Copia #{copy.copyNumber}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(copy.status)}`}>
                              {getStatusText(copy.status)}
                            </span>
                            {copy.isBorrowed && (
                              <span className="text-xs text-blue-600">
                                (Prestada)
                              </span>
                            )}
                          </div>
                          {copy.notes && (
                            <p className="text-sm text-gray-600">Notas: {copy.notes}</p>
                          )}
                          {copy.dueDate && (
                            <p className="text-xs text-gray-500">
                              Devolución: {new Date(copy.dueDate).toLocaleDateString('es-CO')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCopy(copy)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            ✏️ Editar
                          </button>
                          {!copy.isBorrowed && userRole === 'superadmin' && (
                            <button
                              onClick={() => handleDeleteCopy(copy)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              title="Eliminar copia (solo superadmin)"
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCopiesModal;
