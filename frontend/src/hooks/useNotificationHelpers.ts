import { useNotifications } from '../components/NotificationSystem';

// Funciones helper para usar notificaciones en componentes
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const showSuccess = (title: string, message: string, duration = 5000) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  };

  const showError = (title: string, message: string, duration = 7000) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration
    });
  };

  const showWarning = (title: string, message: string, duration = 6000) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  };

  const showInfo = (title: string, message: string, duration = 5000) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  };

  // Función específica para errores de API
  const showApiError = (error: any, defaultMessage = 'Error del servidor') => {
    let title = 'Error del Servidor';
    let message = defaultMessage;

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    showError(title, message);
  };

  // Función específica para respuestas exitosas de API
  const showApiSuccess = (message: string, title = 'Operación Exitosa') => {
    showSuccess(title, message);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError,
    showApiSuccess
  };
};
