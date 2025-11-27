import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X } from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (userId: string, permissions: any) => void;
}

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate
}) => {
  const [permissions, setPermissions] = useState({
    canChangeBookImages: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setPermissions({
        canChangeBookImages: user.specialPermissions?.canChangeBookImages || false
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      await onUpdate(user._id, permissions);
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Error al actualizar permisos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Permisos Especiales
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Info del usuario */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">Rol: {user?.role}</p>
          </div>

          {/* Permisos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Cambiar imágenes de libros
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Permite al usuario cambiar las portadas de los libros
                </p>
              </div>
              <button
                onClick={() => setPermissions(prev => ({
                  ...prev,
                  canChangeBookImages: !prev.canChangeBookImages
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  permissions.canChangeBookImages ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    permissions.canChangeBookImages ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsModal;
