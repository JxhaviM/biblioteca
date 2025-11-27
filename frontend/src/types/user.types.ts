import type { Person } from '../api/auth';

export interface UserManagementProps {
  currentUserRole: 'superadmin' | 'admin' | 'user';
}

export interface UserWithDetails {
  id: string;
  _id?: string; // Para compatibilidad con MongoDB
  username: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'user';
  isActive: boolean;
  tieneCuenta: boolean;
  person?: Person | null;
  personRef?: string;
  tipoPersona?: string;
  grupo?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: any; // Para permitir propiedades adicionales
}
