const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Crear backup de la base de datos
export const createBackup = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/system/backup`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear backup');
  }

  return response.json();
};

// Obtener logs del sistema
export const getLogs = async (filters?: {
  tipo?: string;
  categoria?: string;
  limite?: number;
  pagina?: number;
  buscar?: string;
}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (filters?.tipo) params.append('tipo', filters.tipo);
  if (filters?.categoria) params.append('categoria', filters.categoria);
  if (filters?.limite) params.append('limite', filters.limite.toString());
  if (filters?.pagina) params.append('pagina', filters.pagina.toString());
  if (filters?.buscar) params.append('buscar', filters.buscar);

  const response = await fetch(`${API_URL}/system/logs?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener logs');
  }

  return response.json();
};

// Obtener actividad de usuarios (para Admin - excluye SuperAdmin)
export const getUserActivity = async (filters?: {
  tipo?: string;
  limite?: number;
  pagina?: number;
  buscar?: string;
}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  // Filtrar solo usuarios de rol 'user' y actividades del admin actual
  if (filters?.tipo) params.append('tipo', filters.tipo);
  if (filters?.limite) params.append('limite', filters.limite.toString());
  if (filters?.pagina) params.append('pagina', filters.pagina.toString());
  if (filters?.buscar) params.append('buscar', filters.buscar);
  
  // Filtros específicos para Admin: solo usuarios 'user' y exclude 'superadmin'
  params.append('excludedRoles', 'superadmin,admin');
  params.append('includedRoles', 'user');

  const response = await fetch(`${API_URL}/system/logs?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener actividad de usuarios');
  }

  return response.json();
};

// Obtener estadísticas de logs
export const getLogStats = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/system/logs/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener estadísticas');
  }

  return response.json();
};

// Obtener configuración del sistema
export const getConfig = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/system/config`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener configuración');
  }

  return response.json();
};

// Actualizar configuración del sistema
export const updateConfig = async (seccion: string, datos: any) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/system/config`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seccion, datos }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar configuración');
  }

  return response.json();
};

// Obtener configuración del footer (pública)
export const getFooterConfig = async () => {
  const response = await fetch(`${API_URL}/system/footer`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener configuración del footer');
  }

  return response.json();
};
