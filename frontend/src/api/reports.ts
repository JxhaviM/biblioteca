const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Función para obtener estadísticas del sistema
export const getSystemStats = async (userRole: string, userId?: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': userRole,
        ...(userId && { 'X-User-Id': userId })
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getSystemStats:', error);
    throw error;
  }
};

// Función para obtener reporte de usuarios
export const getUsersReport = async (userRole: string, filters?: any) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters);
    
    const response = await fetch(`${API_BASE_URL}/reports/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': userRole
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener reporte de usuarios');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getUsersReport:', error);
    throw error;
  }
};

// Función para obtener reporte de libros
export const getBooksReport = async (userRole: string, filters?: any) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters);
    
    const response = await fetch(`${API_BASE_URL}/reports/books?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': userRole
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener reporte de libros');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getBooksReport:', error);
    throw error;
  }
};

// Función para obtener reporte de préstamos
export const getLoansReport = async (userRole: string, filters?: any) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters);
    
    const response = await fetch(`${API_BASE_URL}/reports/loans?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': userRole
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener reporte de préstamos');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getLoansReport:', error);
    throw error;
  }
};

// Función para obtener actividad del sistema (solo superadmin)
export const getSystemActivity = async (userRole: string, limit: number = 50) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/reports/activity?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': userRole
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener actividad del sistema');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getSystemActivity:', error);
    throw error;
  }
};

// Función para exportar reportes a Excel/CSV
export const exportReport = async (reportType: string, format: 'excel' | 'csv', filters?: any) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ ...filters, format });
    
    const response = await fetch(`${API_BASE_URL}/reports/export/${reportType}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al exportar reporte');
    }

    // Descargar el archivo
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true };
  } catch (error) {
    console.error('Error en exportReport:', error);
    throw error;
  }
};

// Función para obtener estadísticas en tiempo real
export const getRealTimeStats = async (userRole: string) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/reports/realtime`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Role': userRole
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas en tiempo real');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getRealTimeStats:', error);
    throw error;
  }
};
