import { useState } from 'react';
import { authAPI } from '../api/auth';
import type { CreateAdminData } from '../api/auth';

export interface UserManagementState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useUserManagement = () => {
  const [state, setState] = useState<UserManagementState>({
    loading: false,
    error: null,
    success: false
  });

  const createAdmin = async (data: CreateAdminData): Promise<boolean> => {
    try {
      setState({ loading: true, error: null, success: false });
      
      console.log('🔧 useUserManagement - Enviando datos para crear admin:', data);
      
      const response = await authAPI.createAdmin(data);
      
      console.log('🔧 useUserManagement - Respuesta del servidor:', response);
      
      setState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('🔧 useUserManagement - Error capturado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear administrador';
      console.error('🔧 useUserManagement - Mensaje de error:', errorMessage);
      setState({ loading: false, error: errorMessage, success: false });
      return false;
    }
  };

  const createSuperAdmin = async (data: CreateAdminData): Promise<boolean> => {
    try {
      setState({ loading: true, error: null, success: false });
      
      await authAPI.createSuperAdmin(data);
      
      setState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear super administrador';
      setState({ loading: false, error: errorMessage, success: false });
      return false;
    }
  };

  const resetState = () => {
    setState({ loading: false, error: null, success: false });
  };

  return {
    ...state,
    createAdmin,
    createSuperAdmin,
    resetState
  };
};
