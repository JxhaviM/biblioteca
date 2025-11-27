import React from 'react';
import { buildMediaUrl } from '../config/api';

interface AvatarProps {
  user?: {
    profileImage?: string;
    person?: {
      nombre1?: string;
      apellido1?: string;
      nombreCompleto?: string;
    };
    personRef?: {
      nombre1?: string;
      apellido1?: string;
      nombreCompleto?: string;
    };
    username?: string;
    role?: string;
  };
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  name, 
  size = 'md', 
  className = '' 
}) => {
  // Determinar el tamaño
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-lg'
  };

  // Obtener iniciales
  const getInitials = () => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    
    // Soportar ambas estructuras: person y personRef
    const person = user?.person || user?.personRef;
    
    if (person?.nombre1) {
      return person.nombre1.charAt(0).toUpperCase();
    }
    
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Obtener nombre completo para el alt
  const getFullName = () => {
    if (name) return name;
    
    // Soportar ambas estructuras: person y personRef
    const person = user?.person || user?.personRef;
    
    if (person?.nombreCompleto) {
      return person.nombreCompleto;
    }
    
    if (person?.nombre1 && person?.apellido1) {
      return `${person.nombre1} ${person.apellido1}`.trim();
    }
    
    if (user?.username) {
      return user.username;
    }
    
    return 'Usuario';
  };

  // URL de la imagen de perfil
  const profileImageUrl = user?.profileImage 
    ? buildMediaUrl(user.profileImage) 
    : null;

  // Avatar predefinido con gradientes según rol
  const getAvatarGradient = () => {
    // Determinar el rol del usuario para diferentes colores
    const role = user?.role || 'user';
    
    switch (role) {
      case 'superadmin':
        return 'bg-gradient-to-br from-red-500 to-pink-600';
      case 'admin':
        return 'bg-gradient-to-br from-blue-500 to-indigo-600';
      default:
        return 'bg-gradient-to-br from-green-500 to-teal-600';
    }
  };

  // Si hay imagen de perfil, mostrarla
  if (profileImageUrl) {
    return (
      <div className="relative">
        <img
          src={profileImageUrl}
          alt={getFullName()}
          className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
          onError={(e) => {
            // Mostrar avatar predefinido si falla la carga
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="${sizeClasses[size]} rounded-full ${getAvatarGradient()} flex items-center justify-center text-white font-medium ${className}" title="${getFullName()}">
                  ${getInitials()}
                </div>
              `;
            }
          }}
          onLoad={() => {
            // Imagen cargada exitosamente
          }}
        />
      </div>
    );
  }

  // Avatar predefinido (se muestra si no hay imagen)
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        ${getAvatarGradient()} 
        flex items-center justify-center text-white font-medium
        ${className}
      `}
      title={getFullName()}
    >
      {getInitials()}
    </div>
  );
};

export default Avatar;
