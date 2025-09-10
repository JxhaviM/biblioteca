import type { Person, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Función helper para hacer peticiones autenticadas
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Obtener personas sin cuenta de usuario
export const getPersonsWithoutAccount = async (): Promise<ApiResponse<Person[]>> => {
  return apiRequest<ApiResponse<Person[]>>('/persons/without-account');
};

// Obtener todas las personas
export const getPersons = async (): Promise<ApiResponse<Person[]>> => {
  return apiRequest<ApiResponse<Person[]>>('/persons');
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
