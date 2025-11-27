import type { Person, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Función helper para hacer peticiones autenticadas
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token');
  
  console.log('[API Request] Endpoint:', endpoint);
  console.log('[API Request] Token available:', !!token);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log('[API Request] Sending request with config:', {
    method: config.method || 'GET',
    headers: config.headers,
    body: config.body ? JSON.parse(config.body as string) : undefined
  });

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log('[API Response] Status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('[API Error] Server response:', errorData);
      } catch (e) {
        const text = await response.text();
        console.error('[API Error] Failed to parse error response:', text);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[API Response] Success:', data);
    return data;
  } catch (error) {
    console.error('[API Request Failed]', error);
    throw error;
  }
};

// Obtener personas sin cuenta de usuario
export const getPersonsWithoutAccount = async (search?: string): Promise<ApiResponse<Person[]>> => {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.append('search', search.trim());
  }
  
  const queryString = params.toString();
  const endpoint = queryString ? `/persons/without-account?${queryString}` : '/persons/without-account';
  // Debug: mostrar en consola la URL que se va a llamar
  try { console.log('[api/persons] GET', endpoint); } catch { /* ignore logging errors */ }
  
  return apiRequest<ApiResponse<Person[]>>(endpoint);
};

// Obtener todas las personas (sin límite para carga inicial, limit=500 para búsquedas)
export const getPersons = async (search?: string): Promise<ApiResponse<Person[]>> => {
  try {
    console.log('[getPersons] Iniciando solicitud...');
    const params = new URLSearchParams();
    
    if (search && search.trim()) {
      // Solo limitar cuando hay búsqueda para evitar sobrecargar el backend
      params.append('limit', '500');
      params.append('search', search.trim());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/persons?${queryString}` : '/persons';
    
    console.log('[getPersons] Endpoint:', endpoint);
    console.log('[getPersons] Token:', localStorage.getItem('token')?.substring(0, 20) + '...');
    
    const response = await apiRequest<ApiResponse<Person[]>>(endpoint);
    
    console.log('[getPersons] Respuesta recibida:', {
      success: response.success,
      dataLength: response.data?.length || 0
    });
    
    return response;
  } catch (error) {
    console.error('[getPersons] Error en la solicitud:', error);
    throw error;
  }
};

// Obtener una persona específica
export const getPerson = async (personId: string): Promise<ApiResponse<Person>> => {
  return apiRequest<ApiResponse<Person>>(`/persons/${personId}`);
};

// Crear una nueva persona
export const createPerson = async (personData: {
  doc: string;
  tipoDoc?: 'CC' | 'NES' | 'PPT' | 'RC' | 'TI';
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2?: string;
  genero?: 'Masculino' | 'Femenino';
  fechaNacimiento?: string;
  direccion?: string;
  celular?: string;
  email?: string;
  tipoPersona?: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  grado?: string;
  grupo?: string;
  nivelEducativo?: 'Transición' | 'Primaria' | 'Secundaria' | 'General';
  materias?: string[];
  observaciones?: string;
}): Promise<ApiResponse<Person>> => {
  return apiRequest<ApiResponse<Person>>('/persons', {
    method: 'POST',
    body: JSON.stringify(personData),
  });
};

// Actualizar persona
export const updatePerson = async (personId: string, personData: Partial<Person>): Promise<ApiResponse<Person>> => {
  return apiRequest<ApiResponse<Person>>(`/persons/${personId}`, {
    method: 'PUT',
    body: JSON.stringify(personData),
  });
};

// Cambiar estado de persona
export const changePersonStatus = async (
  personId: string, 
  estado: 'Activo' | 'Suspendido' | 'Vetado',
  motivoEstado?: string
): Promise<ApiResponse<Person>> => {
  return apiRequest<ApiResponse<Person>>(`/persons/${personId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ estado, motivoEstado }),
  });
};

// Carga masiva: subir un CSV con varias personas
export const uploadPersonsBulk = async (file: File, tipoPersona?: string): Promise<ApiResponse<Record<string, unknown>>> => {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('file', file);
  if (tipoPersona) form.append('tipoPersona', tipoPersona);

  const response = await fetch(`${API_BASE_URL}/persons/bulk`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};
