import React, { useState, useEffect } from 'react';
import { resetUserPassword } from '../api/users';
import type { UserUpdateData } from '../types';

// Tipos simplificados para el modal
interface SimpleUser {
  _id?: string;
  id?: string;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
}

interface SimplePerson {
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  direccion?: string;
  celular?: string;
  email?: string;
  tipoPersona: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  grado?: string;
  grupo?: string;
  materias?: string[];
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SimpleUser | null;
  person: SimplePerson | null;
  onSave: (updates: UserUpdateData) => Promise<void>;
  currentUserRole: string;
  currentUserId: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  person,
  onSave,
  currentUserRole,
  currentUserId
}) => {
  const [formData, setFormData] = useState<{
    apellido1: string;
    apellido2: string;
    nombre1: string;
    nombre2: string;
    direccion: string;
    celular: string;
    email: string;
    grado: string;
    grupo: string;
    materias: string[];
    role: 'superadmin' | 'admin' | 'user';
    isActive: boolean;
  }>({
    apellido1: '',
    apellido2: '',
    nombre1: '',
    nombre2: '',
    direccion: '',
    celular: '',
    email: '',
    grado: '',
    grupo: '',
    materias: [],
    role: 'user',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [resetingPassword, setResetingPassword] = useState(false);
  const [newPasswordGenerated, setNewPasswordGenerated] = useState<string | null>(null);
  const [confirmationField, setConfirmationField] = useState<string | null>(null);

  // Permisos de edición por rol
  const getEditableFields = () => {
    const isOwnProfile = user?._id === currentUserId;
    
    if (currentUserRole === 'superadmin') {
      return {
        // Datos personales
        apellido1: true,
        apellido2: true,
        nombre1: true,
        nombre2: true,
        // Contacto
        direccion: true,
        celular: true,
        email: true,
        // Información específica (según tipo)
        grado: person?.tipoPersona === 'Estudiante',
        grupo: person?.tipoPersona === 'Estudiante',
        materias: person?.tipoPersona === 'Profesor',
        // Usuario
        role: true,
        isActive: true
      };
    }
    
    if (currentUserRole === 'admin') {
      // Admin no puede editar otros admins o superadmins
      const canEdit = user?.role === 'user' || isOwnProfile;
      return {
        // Datos personales
        apellido1: canEdit,
        apellido2: canEdit,
        nombre1: canEdit,
        nombre2: canEdit,
        // Contacto
        direccion: canEdit,
        celular: canEdit,
        email: canEdit,
        // Información específica
        grado: canEdit && person?.tipoPersona === 'Estudiante',
        grupo: canEdit && person?.tipoPersona === 'Estudiante',
        materias: canEdit && person?.tipoPersona === 'Profesor',
        // Usuario (solo para users)
        role: false,
        isActive: user?.role === 'user'
      };
    }
    
    // User común - solo su propio contacto
    return {
      apellido1: false,
      apellido2: false,
      nombre1: false,
      nombre2: false,
      direccion: isOwnProfile,
      celular: isOwnProfile,
      email: isOwnProfile,
      grado: false,
      grupo: false,
      materias: false,
      role: false,
      isActive: false
    };
  };

  const editableFields = getEditableFields();

  // Verificar si el usuario actual puede resetear la contraseña del usuario objetivo
  const canResetPassword = () => {
    if (!user || user._id === currentUserId) return false; // No puede resetear su propia contraseña aquí
    
    if (currentUserRole === 'superadmin') {
      // SuperAdmin puede resetear cualquier contraseña, pero necesitamos verificar si es MasterSuperAdmin
      // para otros SuperAdmins (esto se validará en el backend)
      return true;
    }
    
    if (currentUserRole === 'admin') {
      // Admin solo puede resetear contraseñas de usuarios comunes
      return user.role === 'user';
    }
    
    return false;
  };

  // Función para resetear contraseña
  const handleResetPassword = async () => {
    if (!user?._id || !canResetPassword()) return;
    
    if (!confirm('¿Estás seguro de que quieres resetear la contraseña de este usuario? Se generará una nueva contraseña automáticamente.')) {
      return;
    }
    
    setResetingPassword(true);
    try {
      const response = await resetUserPassword(user._id);
      if (response.success && response.data) {
        setNewPasswordGenerated(response.data.newPassword);
        alert(`Contraseña reseteada exitosamente.\n\nNueva contraseña: ${response.data.newPassword}\n\nAsegúrate de compartir esta contraseña con el usuario de forma segura.`);
      }
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      alert('Error al resetear la contraseña. Por favor, intenta nuevamente.');
    } finally {
      setResetingPassword(false);
    }
  };

  useEffect(() => {
    if (isOpen && user && person) {
      setFormData({
        // Datos personales
        apellido1: person.apellido1 || '',
        apellido2: person.apellido2 || '',
        nombre1: person.nombre1 || '',
        nombre2: person.nombre2 || '',
        // Contacto
        direccion: person.direccion || '',
        celular: person.celular || '',
        email: person.email || '',
        // Información específica
        grado: person.grado || '',
        grupo: person.grupo || '',
        materias: person.materias || [],
        // Usuario
        role: user.role,
        isActive: user.isActive
      });
    }
  }, [isOpen, user, person]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | string[]) => {
    // Validación especial para grado/grupo
    if ((field === 'grado' || field === 'grupo') && value !== formData[field]) {
      setConfirmationField(field);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Confirmar cambios de grado/grupo
    if (confirmationField) {
      const confirmed = window.confirm(
        `¿Está seguro de cambiar el ${confirmationField}? Este cambio afecta la estructura académica.`
      );
      if (!confirmed) {
        setConfirmationField(null);
        return;
      }
    }

    setLoading(true);
    
    try {
      // Solo enviar campos que han cambiado
      const updates: UserUpdateData = {};
      
      // Verificar cambios campo por campo
      if (formData.apellido1 !== (person?.apellido1 || '')) updates.apellido1 = formData.apellido1;
      if (formData.apellido2 !== (person?.apellido2 || '')) updates.apellido2 = formData.apellido2;
      if (formData.nombre1 !== (person?.nombre1 || '')) updates.nombre1 = formData.nombre1;
      if (formData.nombre2 !== (person?.nombre2 || '')) updates.nombre2 = formData.nombre2;
      if (formData.direccion !== (person?.direccion || '')) updates.direccion = formData.direccion;
      if (formData.celular !== (person?.celular || '')) updates.celular = formData.celular;
      if (formData.email !== (person?.email || '')) updates.email = formData.email;
      if (formData.grado !== (person?.grado || '')) updates.grado = formData.grado;
      if (formData.grupo !== (person?.grupo || '')) updates.grupo = formData.grupo;
      if (JSON.stringify(formData.materias) !== JSON.stringify(person?.materias || [])) updates.materias = formData.materias;
      if (formData.role !== user?.role) updates.role = formData.role;
      if (formData.isActive !== user?.isActive) updates.isActive = formData.isActive;

      if (Object.keys(updates).length > 0) {
        await onSave(updates);
      }
      
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios');
    } finally {
      setLoading(false);
      setConfirmationField(null);
    }
  };

  if (!isOpen || !user || !person) return null;

  const isOwnProfile = user && currentUserId && (user._id === currentUserId || user.id === currentUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isOwnProfile ? 'Editar Mi Perfil' : `Editar Usuario: ${user.username}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-lg font-semibold text-gray-800 border-b pb-2">
              Datos Personales
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primer Apellido *
              </label>
              <input
                type="text"
                value={formData.apellido1}
                onChange={(e) => handleInputChange('apellido1', e.target.value)}
                disabled={!editableFields.apellido1}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.apellido1 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segundo Apellido
              </label>
              <input
                type="text"
                value={formData.apellido2}
                onChange={(e) => handleInputChange('apellido2', e.target.value)}
                disabled={!editableFields.apellido2}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.apellido2 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primer Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre1}
                onChange={(e) => handleInputChange('nombre1', e.target.value)}
                disabled={!editableFields.nombre1}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.nombre1 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segundo Nombre
              </label>
              <input
                type="text"
                value={formData.nombre2}
                onChange={(e) => handleInputChange('nombre2', e.target.value)}
                disabled={!editableFields.nombre2}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.nombre2 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <h3 className="col-span-full text-lg font-semibold text-gray-800 border-b pb-2">
              Información de Contacto
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                disabled={!editableFields.direccion}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.direccion 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                type="tel"
                value={formData.celular}
                onChange={(e) => handleInputChange('celular', e.target.value)}
                disabled={!editableFields.celular}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.celular 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!editableFields.email}
                className={`w-full px-3 py-2 border rounded-md ${
                  !editableFields.email 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Información Específica */}
          {(person.tipoPersona === 'Estudiante' || person.tipoPersona === 'Profesor') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-semibold text-gray-800 border-b pb-2">
                Información {person.tipoPersona === 'Estudiante' ? 'Académica' : 'Profesional'}
              </h3>
              
              {person.tipoPersona === 'Estudiante' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grado *
                    </label>
                    <input
                      type="text"
                      value={formData.grado}
                      onChange={(e) => handleInputChange('grado', e.target.value)}
                      disabled={!editableFields.grado}
                      className={`w-full px-3 py-2 border rounded-md ${
                        !editableFields.grado 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupo *
                    </label>
                    <input
                      type="text"
                      value={formData.grupo}
                      onChange={(e) => handleInputChange('grupo', e.target.value)}
                      disabled={!editableFields.grupo}
                      className={`w-full px-3 py-2 border rounded-md ${
                        !editableFields.grupo 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </>
              )}

              {person.tipoPersona === 'Profesor' && (
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Materias (separadas por comas)
                  </label>
                  <textarea
                    value={Array.isArray(formData.materias) ? formData.materias.join(', ') : formData.materias}
                    onChange={(e) => handleInputChange('materias', e.target.value.split(',').map(m => m.trim()))}
                    disabled={!editableFields.materias}
                    className={`w-full px-3 py-2 border rounded-md ${
                      !editableFields.materias 
                        ? 'bg-gray-100 text-gray-500' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Información de Usuario (Solo Admin/SuperAdmin) */}
          {(currentUserRole === 'superadmin' || (currentUserRole === 'admin' && user.role === 'user')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-semibold text-gray-800 border-b pb-2">
                Configuración de Usuario
              </h3>
              
              {editableFields.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                    {currentUserRole === 'superadmin' && (
                      <option value="superadmin">Super Administrador</option>
                    )}
                  </select>
                </div>
              )}

              {editableFields.isActive && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-between items-center pt-6 border-t">
            {/* Botón de resetear contraseña (izquierda) */}
            {canResetPassword() && (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || resetingPassword}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {resetingPassword ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                    </svg>
                    <span>Reseteando...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Resetear Contraseña</span>
                  </>
                )}
              </button>
            )}
            
            {/* Botones principales (derecha) */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
