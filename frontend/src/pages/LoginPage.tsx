import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { useUserContext } from '../contexts/UserContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('🔐 LoginPage - Path actual:', location.pathname);
    console.log('🔐 LoginPage - Información completa de location:', location);
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login({ 
        username: formData.username, 
        password: formData.password 
      });
      
      console.log('🔑 Login response in component:', response); // Para debug
      console.log('🔍 Response details:');
      console.log('- response.success:', response.success);
      console.log('- response.data:', response.data);
      console.log('- response.user:', response.user);
      
      // Check what was stored in localStorage after login
      console.log('📦 After login - localStorage contents:');
      console.log('- token:', localStorage.getItem('token'));
      console.log('- user:', localStorage.getItem('user'));
      console.log('- person:', localStorage.getItem('person'));
      
      if (response.success) {
        console.log('✅ Login was successful, proceeding with navigation...');
        
        // authAPI.login() ya guardó todo en localStorage
        // Solo necesitamos navegar
        
        // Obtener datos del usuario para determinar el rol
        let userData;
        
        if (response.data && response.data.user) {
          userData = response.data.user;
        } else if (response.user) {
          userData = response.user;
        }
        
        if (userData) {
          // authAPI.login() ya guardó todo en localStorage
          // Solo necesitamos navegar
          
          // FORZAR navegación completa del navegador
          const userRole = userData.role;
          
          switch (userRole) {
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
        } else {
          setError('Error al obtener datos del usuario');
        }
      } else {
        setError(response.message || 'Error en el inicio de sesión');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión. Intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div>
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Botón de regreso */}
        <button
          onClick={handleBackToHome}
          className="mb-8 flex items-center space-x-2 text-white/70 hover:text-white transition-colors group"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
          <span className="font-medium">Volver al inicio</span>
        </button>

        {/* Tarjeta de login */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-white">
                    Biblioteca Digital
                  </h2>
                  <p className="text-white/80 text-sm">
                    Acceso al sistema
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-white font-semibold">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ingresa tu nombre de usuario"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-white/40">👤</span>
                  </div>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-white font-semibold">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-red-400 text-lg">⚠️</span>
                    <span className="text-red-100 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Botón de submit */}
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.password}
                className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Información adicional */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-center space-y-3">
                <p className="text-white/60 text-sm">
                  Acceso seguro al sistema de biblioteca
                </p>
                <div className="text-xs text-white/40">
                  🔒 Conexión segura cifrada
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credenciales de prueba */}
        <div className="mt-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h4 className="text-white font-semibold mb-3 text-center">
            🔑 Credenciales Disponibles
          </h4>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="text-blue-300 font-semibold">SuperAdmin (Único usuario activo):</div>
              <div className="text-white/70 ml-4">
                <p><strong>Usuario:</strong> super.administrador</p>
                <p><strong>Contraseña:</strong> admin123</p>
              </div>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mt-4">
              <div className="text-yellow-300 text-xs">
                ⚠️ <strong>Nota:</strong> Para crear más usuarios, usa el SuperAdmin Dashboard una vez que inicies sesión.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;