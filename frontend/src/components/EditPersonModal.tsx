import React, { useEffect, useState } from 'react';
import { updatePerson } from '../api/persons';
import { createUser } from '../api/users';
import type { Person } from '../types';
import { User, Plus, UserX } from 'lucide-react';

interface Props {
  isOpen: boolean;
  person: Person | null;
  onClose: () => void;
  onSaved: (updated: Person) => void;
}

const EditPersonModal: React.FC<Props> = ({ isOpen, person, onClose, onSaved }) => {
  const [form, setForm] = useState<Partial<Person>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'superadmin'
  });
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    if (isOpen && person) {
      setForm({ ...person });
      setError(null);
      setShowCreateUser(false);
      setUserForm({
        username: '',
        password: '',
        role: 'user'
      });
    }
  }, [isOpen, person]);

  if (!isOpen || !person) return null;

  const handleChange = <K extends keyof Person>(key: K, value: Person[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleUserFormChange = (field: string, value: string) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.password) {
      setError('Por favor completa todos los campos del usuario');
      return;
    }

    setUserLoading(true);
    setError(null);
    
    try {
      const userData = {
        personId: person._id,
        role: userForm.role,
        customUsername: userForm.username,
        password: userForm.password
      };

      const response = await createUser(userData);
      
      if (response.success) {
        // Actualizar la persona con la información del usuario
        const updatedPerson = {
          ...form,
          userInfo: {
            username: userForm.username,
            role: userForm.role,
            userId: response.data?.user?._id || 'temp-id'
          }
        };
        
        onSaved(updatedPerson as any);
        setShowCreateUser(false);
        setUserForm({ username: '', password: '', role: 'user' });
      } else {
        setError(response.message || 'Error al crear usuario');
      }
    } catch (err) {
      console.error(err);
      const e = err as Error;
      setError(e.message || 'Error al crear usuario');
    } finally {
      setUserLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await updatePerson(person._id as string, form);
      // response shape: { success: boolean, data: Person }
      const typed = res as { success: boolean; data?: Person };
      if (typed && typed.data) {
        onSaved(typed.data);
        onClose();
      } else {
        setError('No se pudo actualizar la persona');
      }
    } catch (err) {
      console.error(err);
      const e = err as Error;
      setError(e.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Editar persona</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        {/* Información del usuario existente */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Información de Usuario</span>
            </div>
            {(person as any).userInfo ? (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Usuario:</span> {(person as any).userInfo?.nombreUsuario || 'N/A'}
                <span className="ml-3 font-medium">Rol:</span> {(person as any).userInfo?.rol || 'N/A'}
              </div>
            ) : (
              <div className="flex items-center">
                <UserX className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-600">Sin usuario asignado</span>
                {!showCreateUser && (
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crear Usuario
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulario para crear usuario */}
        {showCreateUser && !(person as any).userInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Crear Nuevo Usuario</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => handleUserFormChange('username', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej: oscar.moreno"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => handleUserFormChange('password', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                  placeholder="Contraseña temporal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) => handleUserFormChange('role', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowCreateUser(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={userLoading}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
              >
                {userLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Primer Nombre</label>
              <input value={form.nombre1 || ''} onChange={e => handleChange('nombre1', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Segundo Nombre</label>
              <input value={form.nombre2 || ''} onChange={e => handleChange('nombre2', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Primer Apellido</label>
              <input value={form.apellido1 || ''} onChange={e => handleChange('apellido1', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Segundo Apellido</label>
              <input value={form.apellido2 || ''} onChange={e => handleChange('apellido2', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Documento</label>
              <input value={form.doc || ''} onChange={e => handleChange('doc', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Tipo Documento</label>
              <select value={form.tipoDoc || 'CC'} onChange={e => handleChange('tipoDoc', e.target.value as Person['tipoDoc'])} className="w-full px-2 py-1 border rounded text-sm">
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="PPT">PPT</option>
                <option value="RC">RC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Género</label>
              <select value={form.genero || ''} onChange={e => handleChange('genero', e.target.value as Person['genero'])} className="w-full px-2 py-1 border rounded text-sm">
                <option value="">-</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Fecha Nacimiento</label>
              <input type="date" value={form.fechaNacimiento ? form.fechaNacimiento.split('T')[0] : ''} onChange={e => handleChange('fechaNacimiento', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Celular</label>
              <input value={form.celular || ''} onChange={e => handleChange('celular', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-normal text-gray-600 mb-1">Dirección</label>
              <input value={form.direccion || ''} onChange={e => handleChange('direccion', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
          </div>

          {/* Tipo persona y campos condicionales */}
          <div>
            <label className="block text-xs font-normal text-gray-600 mb-1">Tipo de Persona</label>
            <select value={form.tipoPersona || 'Publico'} onChange={e => handleChange('tipoPersona', e.target.value as Person['tipoPersona'])} className="w-full px-2 py-1 border rounded text-sm">
              <option value="Estudiante">Estudiante</option>
              <option value="Profesor">Profesor</option>
              <option value="Colaborador">Colaborador</option>
              <option value="Publico">Público</option>
            </select>
          </div>

          {form.tipoPersona === 'Estudiante' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-normal text-gray-600 mb-1">Grado</label>
                  <input value={form.grado || ''} onChange={e => handleChange('grado', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-600 mb-1">Grupo</label>
                <input value={form.grupo || ''} onChange={e => handleChange('grupo', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
            </div>
          )}

          {form.tipoPersona === 'Profesor' && (
            <div>
              <label className="block text-xs font-normal text-gray-600">Nivel Educativo</label>
              <input value={form.nivelEducativo || ''} onChange={e => handleChange('nivelEducativo', e.target.value as Person['nivelEducativo'])} className="w-full px-2 py-1 border rounded text-sm" />
              <label className="block text-xs font-normal text-gray-600 mt-2">Materias (coma separadas)</label>
              <input value={(form.materias || []).join(', ')} onChange={e => handleChange('materias', e.target.value.split(',').map(s => s.trim()))} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded border text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>

          {error && <div className="text-red-600">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal;
