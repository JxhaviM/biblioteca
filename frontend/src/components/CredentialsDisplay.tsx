import React, { useState } from 'react';

interface CredentialsDisplayProps {
  username: string;
  password: string;
  role: string;
  personName?: string;
  onClose: () => void;
}

const CredentialsDisplay: React.FC<CredentialsDisplayProps> = ({ 
  username, 
  password, 
  role, 
  personName,
  onClose 
}) => {
  const [copied, setCopied] = useState<'username' | 'password' | 'all' | null>(null);

  const copyToClipboard = async (text: string, type: 'username' | 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return '🔑';
      case 'admin': return '👨‍💼';
      case 'user': return '👤';
      default: return '👤';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin': return 'SuperAdministrador';
      case 'admin': return 'Administrador';
      case 'user': return 'Usuario';
      default: return role;
    }
  };

  const credentialsText = `Usuario: ${username}\nContraseña: ${password}\nRol: ${getRoleDisplayName(role)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-xl font-bold flex items-center">
            <span className="mr-2">✅</span>
            Usuario Creado Exitosamente
          </h3>
          {personName && (
            <p className="text-green-100 text-sm mt-1">Para: {personName}</p>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Rol Badge */}
          <div className="text-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${
              role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
              role === 'admin' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              <span className="mr-2 text-xl">{getRoleIcon(role)}</span>
              {getRoleDisplayName(role)}
            </span>
          </div>

          {/* Credenciales */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Usuario:</label>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-1 rounded border border-gray-300 text-sm font-mono">
                  {username}
                </code>
                <button
                  onClick={() => copyToClipboard(username, 'username')}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copiar usuario"
                >
                  {copied === 'username' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Contraseña:</label>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-1 rounded border border-gray-300 text-sm font-mono">
                  {password}
                </code>
                <button
                  onClick={() => copyToClipboard(password, 'password')}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copiar contraseña"
                >
                  {copied === 'password' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Importante</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Guarda estas credenciales en un lugar seguro. La contraseña no se volverá a mostrar.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => copyToClipboard(credentialsText, 'all')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {copied === 'all' ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar Todo
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialsDisplay;
