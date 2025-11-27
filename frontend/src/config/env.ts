// Configuración de variables de entorno para el frontend
// Solo las variables con prefijo VITE_ son accesibles en el navegador
import { API_BASE_URL } from './api';

export const config = {
  // API Configuration
  API_URL: API_BASE_URL,
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Sistema de Biblioteca',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  
  // Derived values
  IS_DEVELOPMENT: import.meta.env.VITE_NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.VITE_NODE_ENV === 'production',
} as const;

// Validar variables críticas en desarrollo
if (config.IS_DEVELOPMENT) {
  console.log('🔧 Frontend Config:', {
    API_URL: config.API_URL,
    APP_NAME: config.APP_NAME,
    NODE_ENV: config.NODE_ENV,
  });
}

export default config;
