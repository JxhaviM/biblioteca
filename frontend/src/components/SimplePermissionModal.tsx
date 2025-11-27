import React from 'react';

interface SimplePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimplePermissionModal: React.FC<SimplePermissionModalProps> = ({ isOpen, onClose }) => {
  console.log('🎯 [SIMPLE DEBUG] Componente renderizado con isOpen:', isOpen);

  if (!isOpen) {
    console.log('❌ [SIMPLE DEBUG] Modal cerrado, retornando null');
    return null;
  }

  console.log('✅ [SIMPLE DEBUG] Modal abierto, renderizando contenido');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Permisos (Simple Debug)</h3>
          <button
            onClick={() => {
              console.log('❌ [SIMPLE DEBUG] Botón cerrar clickeado');
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium">Permiso 1</h4>
            <p className="text-sm text-gray-600">Descripción del permiso 1</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium">Permiso 2</h4>
            <p className="text-sm text-gray-600">Descripción del permiso 2</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePermissionModal;
