import { toast } from 'react-toastify';

interface ApiError extends Error {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message: string;
}

export const handleApiError = (error: unknown, defaultMessage = 'Ocurrió un error inesperado'): string => {
  console.error('API Error:', error);
  
  const apiError = error as ApiError;
  let errorMessage = defaultMessage;
  
  if (apiError.response) {
    // Error de la API con respuesta
    const { status, data } = apiError.response;
    
    switch (status) {
      case 400:
        errorMessage = 'Solicitud incorrecta. Verifica los datos ingresados.';
        break;
      case 401:
        errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        // Opcional: Podrías redirigir al login aquí
        break;
      case 403:
        errorMessage = 'No tienes permisos para realizar esta acción.';
        break;
      case 404:
        errorMessage = 'Recurso no encontrado.';
        break;
      case 500:
        errorMessage = 'Error interno del servidor. Por favor, inténtalo más tarde.';
        break;
      default:
        errorMessage = `Error ${status}: ${data?.message || defaultMessage}`;
    }
  } else if (apiError.message) {
    // Error de red u otro error
    errorMessage = apiError.message;
  }
  
  // Mostrar notificación de error
  toast.error(errorMessage, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
  
  return errorMessage;
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showWarning = (message: string) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};
