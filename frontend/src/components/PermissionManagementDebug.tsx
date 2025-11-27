import React, { useState, useEffect } from 'react';
import { getPermissions } from '../api/permissions';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import type { Permission } from '../types';

interface PermissionManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionManagementDebug: React.FC<PermissionManagementProps> = ({ isOpen, onClose }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const { showError, showApiError } = useNotificationHelpers();

  console.log('🎯 [PERMISSION DEBUG] Componente renderizado con isOpen:', isOpen);

  useEffect(() => {
    console.log('🔄 [PERMISSION DEBUG] useEffect ejecutándose con isOpen:', isOpen);
    if (isOpen) {
      console.log('🔄 [PERMISSION DEBUG] Modal abierto, cargando permisos...');
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    try {
      console.log('📡 [PERMISSION DEBUG] Llamando a getPermissions()');
      setLoading(true);
      const response = await getPermissions();
      console.log('📡 [PERMISSION DEBUG] Respuesta recibida:', response);
      if (response.success) {
        setPermissions(response.data || []);
        console.log(`✅ [PERMISSION DEBUG] ${response.data?.length || 0} permisos cargados`);
      } else {
        console.error('❌ [PERMISSION DEBUG] Error en respuesta:', response.message);
        showError('Error', response.message || 'Error al cargar permisos');
      }
    } catch (error) {
      console.error('❌ [PERMISSION DEBUG] Error en loadPermissions:', error);
      showApiError(error, 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('❌ [PERMISSION DEBUG] Modal cerrado, retornando null');
    return null;
  }

  console.log('✅ [PERMISSION DEBUG] Modal abierto, renderizando contenido');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Gestión de Permisos (Debug)</h3>
          <button
            onClick={() => {
              console.log('❌ [PERMISSION DEBUG] Botón cerrar clickeado');
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={loadPermissions}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Recargar Permisos
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando permisos...</div>
        ) : (
          <div className="space-y-4">
            {permissions.length > 0 ? (
              permissions.map((permission) => (
                <div key={permission._id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{permission.name}</h4>
                  <p className="text-sm text-gray-600">{permission.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {permission.resource} - {permission.action}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay permisos disponibles
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionManagementDebug;
