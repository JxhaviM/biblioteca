import { useState, useEffect } from 'react';
import { getConfig, getFooterConfig } from '../api/system';
import { useAuth } from './useAuth';

interface FooterConfig {
  logo?: string;
  desarrolladoPor?: string;
  anio?: string;
  institucion?: string;
  mostrarLogo?: boolean;
}

interface Config {
  footer?: FooterConfig;
  sistema?: any;
  prestamos?: any;
  usuarios?: any;
  personas?: any;
  email?: any;
}

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const { getToken, isAuthenticated } = useAuth();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Siempre cargar la configuración del footer (endpoint público)
      const footerResponse = await getFooterConfig();
      
      // Obtener usuario del localStorage
      const savedUser = localStorage.getItem('user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      
      let fullConfig = { footer: footerResponse.footer };
      
      // Si es admin o superadmin, cargar configuración completa
      if (isAuthenticated() && getToken() && user && (user.role === 'admin' || user.role === 'superadmin')) {
        const response = await getConfig();
        fullConfig = { ...fullConfig, ...response.config };
      }
      
      setConfig(fullConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      // Configuración por defecto
      setConfig({
        footer: {
          logo: '',
          desarrolladoPor: '1102 PROM 2025',
          anio: '2025',
          institucion: 'I.E. San Pedro Claver',
          mostrarLogo: true
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, refreshConfig: loadConfig };
};
