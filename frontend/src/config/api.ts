// Configuración centralizada de la API
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Para imágenes y archivos estáticos
export const MEDIA_BASE_URL = '/uploads';

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Función helper para construir URLs de medios
export const buildMediaUrl = (path: string) => {
  // Si el path ya empieza con /uploads, solo devolver el path
  if (path.startsWith('/uploads')) {
    return path;
  }
  // Si no, agregar /uploads al principio
  return `${MEDIA_BASE_URL}${path}`;
};
