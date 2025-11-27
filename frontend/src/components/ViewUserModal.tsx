import React from 'react';
import type { User, Person } from '../api/auth';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  person: Person | null;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user, person }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-bold">Detalles del Usuario</h3>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información de Usuario */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👤</span> Información de Usuario
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  {user.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  {user.tipoPersona || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Último Login</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Nunca ha iniciado sesión'}
                </p>
              </div>
            </div>
          </div>

          {/* Información de Persona */}
          {person && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📋</span> Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {[person.nombre1, person.nombre2, person.apellido1, person.apellido2]
                      .filter(Boolean)
                      .join(' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.doc || 'N/A'} ({person.tipoDoc || 'CC'})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.genero || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grado/Grupo</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.grado ? `${person.grado}${person.grupo ? ' - ' + person.grupo : ''}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.celular || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.email || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.direccion || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {person.fechaNacimiento ? new Date(person.fechaNacimiento).toLocaleDateString('es-CO') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Persona</label>
                  <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      person.estado === 'Activo' ? 'bg-green-100 text-green-800' : 
                      person.estado === 'Vetado' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {person.estado || 'N/A'}
                    </span>
                  </p>
                </div>
                {person.observaciones && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                      {person.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información Adicional */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">ℹ️</span> Información Adicional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiene Cuenta</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    person?.tieneCuenta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {person?.tieneCuenta ? 'SÍ' : 'NO'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Master SuperAdmin</label>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.isMasterSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isMasterSuperAdmin ? 'SÍ' : 'NO'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
