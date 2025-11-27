import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg' 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-11/12 md:w-1/3 max-w-md',
    md: 'w-11/12 md:w-1/2 max-w-lg',
    lg: 'w-11/12 md:w-3/4 lg:w-1/2 max-w-2xl',
    xl: 'w-11/12 md:w-5/6 lg:w-3/4 max-w-4xl',
    '2xl': 'w-11/12 md:w-5/6 lg:w-4/5 max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full bg-white rounded-lg shadow-xl ${sizeClasses[size as keyof typeof sizeClasses]}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
