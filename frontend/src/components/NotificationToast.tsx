import { useEffect } from 'react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

const NotificationToast = ({ notification, onClose }: NotificationToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="mb-4 animate-slide-in">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
        <div className="flex">
          <div className={`${colors[notification.type]} w-2 flex-shrink-0`}></div>
          <div className="flex-1 p-4">
            <div className="flex items-start">
              <div className={`${colors[notification.type]} rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0`}>
                {icons[notification.type]}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{notification.title}</h3>
                <p className="text-sm text-gray-600">{notification.message}</p>
              </div>
              <button
                onClick={() => onClose(notification.id)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
