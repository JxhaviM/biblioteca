import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import ForceChangePasswordModal from './ForceChangePasswordModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userData: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForceChangePassword, setShowForceChangePassword] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('🔐 LoginModal - Abierto en path:', location.pathname);
    }
  }, [isOpen, location]);

  // Limpiar formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({ username: '', password: '' });
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 LoginModal - Intentando login para:', formData.username);
      
      const response = await authAPI.login(formData);
      
      if (response.success) {
        console.log('✅ LoginModal - Login exitoso:', response.user);
        
        // Guardar datos en localStorage
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        if (response.person) {
          localStorage.setItem('person', JSON.stringify(response.person));
        }

        // Verificar si necesita cambiar contraseña
        if (response.mustChangePassword && response.user) {
          console.log('⚠️ LoginModal - Usuario debe cambiar contraseña');
          const dashboardPath = `/dashboard/${response.user.role}`;
          setPendingRedirect(dashboardPath);
          setShowForceChangePassword(true);
          // No cerrar el modal principal aún; manténlo montado para renderizar el ForceChangePasswordModal
          return;
        }

        // Callback de éxito
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }

        // Cerrar modal
        onClose();

        // Redirigir según el rol usando window.location.href
        if (response.user) {
          const role = response.user.role;
          
          switch (role) {
            case 'superadmin':
              window.location.href = '/dashboard/superadmin';
              break;
            case 'admin':
              window.location.href = '/dashboard/admin';
              break;
            case 'user':
              window.location.href = '/dashboard/user';
              break;
            default:
              window.location.href = '/dashboard';
          }
        }
        
      } else {
        setError(response.message || 'Error en el login');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // No renderizar si no está abierto y no se requiere cambio de contraseña
  if (!isOpen && !showForceChangePassword) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header del Modal */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
                  <p className="text-green-100 text-sm">Sistema Biblioteca MERN</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del Modal */}
          <div className="p-6">
            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                />
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all pr-12"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M18.364 18.364L9.636 9.636" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Enlaces adicionales */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                  Regístrate aquí
                </button>
              </p>
              <p className="text-xs text-gray-500">
                ¿Olvidaste tu contraseña?{' '}
                <button className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                  Recuperar
                </button>
              </p>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Sistema Biblioteca MERN</span>
              <span>Versión 1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cambio Obligatorio de Contraseña */}
      {showForceChangePassword && (
        <ForceChangePasswordModal
          isOpen={showForceChangePassword}
          username={formData.username}
          onSuccess={() => {
            console.log('✅ Contraseña cambiada exitosamente, redirigiendo...');
            setShowForceChangePassword(false);
            // Redirigir al dashboard
            if (pendingRedirect) {
              // Redirigir con navigate para no recargar
              navigate(pendingRedirect, { replace: true });
            }
          }}
        />
      )}
    </div>
  );
};

export default LoginModal;
