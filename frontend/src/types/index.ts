// Tipos para Usuario
export interface User {
  _id: string;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  personRef: string;
  tipoPersona: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  isActive: boolean;
  fechaCreacion: string;
  lastLogin?: string;
  passwordResetCount: number;
  createdAt: string;
  updatedAt: string;
}

// Tipos para Persona
export interface Person {
  _id: string;
  doc: string;
  tipoDoc: 'CC' | 'NES' | 'PPT' | 'RC' | 'TI';
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  genero: 'Masculino' | 'Femenino';
  direccion?: string;
  celular?: string;
  email?: string;
  tipoPersona: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  // Campos específicos para Estudiantes
  grado?: string;
  grupo?: string;
  // Campos específicos para Profesores
  nivelEducativo?: 'Transición' | 'Primaria' | 'Secundaria' | 'General';
  materias?: string[];
  estado: 'Activo' | 'Suspendido' | 'Vetado';
  motivoEstado?: string;
  observaciones?: string;
  fechaNacimiento?: string;
  tieneCuenta: boolean;
  isActive: boolean;
  deletedAt?: string;
  fechaCreacion: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para auditoría
export interface AuditEntry {
  _id: string;
  userId: string;
  targetUserId: string;
  targetPersonId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'PASSWORD_RESET';
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para formularios de edición
export interface UserUpdateData {
  // Datos de User
  role?: 'superadmin' | 'admin' | 'user';
  isActive?: boolean;
  // Datos de Person
  apellido1?: string;
  apellido2?: string;
  nombre1?: string;
  nombre2?: string;
  direccion?: string;
  celular?: string;
  email?: string;
  grado?: string;
  grupo?: string;
  materias?: string[];
}

export interface FormData {
  apellido1: string;
  apellido2: string;
  nombre1: string;
  nombre2: string;
  direccion: string;
  celular: string;
  email: string;
  grado: string;
  grupo: string;
  materias: string[];
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
}

// Respuesta de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  changesCount?: number;
}
