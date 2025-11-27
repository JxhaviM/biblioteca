import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { buildApiUrl } from '../config/api';

interface UserData {
  user: any;
  person: any;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

export const useUserData = (): UserData => {
  const [user, setUser] = useState<any>(null);
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        setUser(null);
        setPerson(null);
        setLoading(false);
        return; // No lanzar error, solo salir
      }

      // Obtener datos del usuario autenticado
      const userResponse = await fetch(buildApiUrl('/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Error al cargar los datos del usuario');
      }

      const userData = await userResponse.json();
      
      if (userData.success && userData.data) {
        const { user: userInfo, person: personInfo } = userData.data;
        
        // Guardar en el estado local
        setUser(userInfo);
        setPerson(personInfo);
        
        // Guardar en localStorage para persistencia
        if (userInfo) localStorage.setItem('user', JSON.stringify(userInfo));
        if (personInfo) localStorage.setItem('person', JSON.stringify(personInfo));
        
        setError(null);
      } else {
        throw new Error(userData.message || 'Error al obtener datos del usuario');
      }
    } catch (err: any) {
      console.error('Error al cargar datos del usuario:', err);
      setError(err.message || 'Error al cargar los datos del usuario');
      // Limpiar datos inválidos del localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('person');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    // Primero intentar cargar desde localStorage para una experiencia más rápida
    const savedUser = localStorage.getItem('user');
    const savedPerson = localStorage.getItem('person');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPerson) setPerson(JSON.parse(savedPerson));
    
    // Solo actualizar con datos del servidor si hay token
    const token = getToken();
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  return {
    user,
    person,
    loading,
    error,
    refreshUserData: fetchUserData
  };
};

export default useUserData;
