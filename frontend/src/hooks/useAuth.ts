import { useNavigate } from 'react-router-dom';
import type { Dispatch, SetStateAction } from 'react';
import { authAPI } from '../api/auth';
import type { User, Person } from '../api/auth';

interface UseAuthProps {
  setUser?: Dispatch<SetStateAction<User | null>>;
  setPerson?: Dispatch<SetStateAction<Person | null>>;
}

export const useAuth = (props: UseAuthProps = {}) => {
  const { setUser, setPerson } = props;
  const navigate = useNavigate();

  const logout = () => {
    // 1. Limpiar localStorage PRIMERO
    authAPI.logout();
    
    // 2. Limpiar estados INMEDIATAMENTE si hay setters
    if (setUser) setUser(null);
    if (setPerson) setPerson(null);
    
    // 3. Redirigir directo al home SIN delay
    navigate('/', { replace: true });
  };

  // Obtener el token del localStorage
  const getToken = (): string | null => {
    return localStorage.getItem('token');
  };

  // Verificar si hay un usuario autenticado
  const isAuthenticated = (): boolean => {
    return !!getToken();
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        if (setUser) {
          setUser(response.data.user);
        }
        if (setPerson && response.data.person) {
          setPerson(response.data.person);
        }
        
        // Redirigir según el rol
        switch (response.data.user.role) {
          case 'superadmin':
            navigate('/dashboard/superadmin', { replace: true });
            break;
          case 'admin':
            navigate('/dashboard/admin', { replace: true });
            break;
          case 'user':
            navigate('/', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
            break;
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error durante login:', error);
      throw error;
    }
  };

  return {
    login,
    logout,
    getToken,
    isAuthenticated
  };
};