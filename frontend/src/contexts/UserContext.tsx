import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Person } from '../api/auth';
import { buildApiUrl } from '../config/api';

interface UserContextType {
  user: User | null;
  person: Person | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setPerson: (person: Person | null) => void;
  login: (userData: User, personData?: Person) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setPerson(null);
        setLoading(false);
        return;
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('person');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedPerson = localStorage.getItem('person');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
    if (savedPerson) setPerson(JSON.parse(savedPerson));
    
    const token = localStorage.getItem('token');
    if (token && savedUser) {
      // Si ya tenemos datos en localStorage, establecer loading = false INMEDIATAMENTE
      // y hacer fetch en background para actualizar datos
      setLoading(false);
      fetchUserData();
    } else if (token) {
      // Si hay token pero no datos, esperar a fetchUserData
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
    if (userData) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...userData }));
      }
    }
  };

  const login = (userData: User, personData?: Person) => {
    setUser(userData);
    setPerson(personData || null);
    setLoading(false);
    setError(null);
    
    // Guardar en localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    if (personData) {
      localStorage.setItem('person', JSON.stringify(personData));
    }
  };

  const value: UserContextType = {
    user,
    person,
    loading,
    error,
    refreshUserData: fetchUserData,
    updateUserProfile,
    setUser,
    setPerson,
    login
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
