import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    
    if (user) {
      // Redirigir según el rol del usuario
      switch (user.role) {
        case 'superadmin':
          navigate('/dashboard/superadmin', { replace: true });
          break;
        case 'admin':
          navigate('/dashboard/admin', { replace: true });
          break;
        case 'user':
          navigate('/dashboard/user', { replace: true });
          break;
        default:
          navigate('/dashboard/user', { replace: true });
          break;
      }
    }
  }, [navigate]);

  // Mostrar un loader mientras se realiza la redirección
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-white/30 rounded-full animate-spin border-t-white mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Redirigiendo...</h2>
          <p className="text-white/70">Te estamos llevando a tu dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
