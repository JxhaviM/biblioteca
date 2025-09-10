import React, { useState, useEffect } from 'react';
import type { Person } from '../types';
import { getPersonsWithoutAccount } from '../api/persons';
import { createUser, createUserWithPerson } from '../api/users';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentUserRole: 'superadmin' | 'admin';
  isMasterSuperAdmin?: boolean;
}

type TabType = 'existing' | 'new';

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserRole,
  isMasterSuperAdmin = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('existing');
  const [loading, setLoading] = useState(false);

  // Estados para pestaña "Seleccionar Persona Existente"
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [customUsername, setCustomUsername] = useState('');
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para pestaña "Crear Persona y Usuario"
  const [newUserData, setNewUserData] = useState({
    // Datos del usuario
    username: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'superadmin',
    
    // Datos de la persona
    doc: '',
    tipoDoc: 'CC' as 'CC' | 'NES' | 'PPT' | 'RC' | 'TI',
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    genero: 'Masculino' as 'Masculino' | 'Femenino',
    fechaNacimiento: '',
    direccion: '',
    celular: '',
    email: '',
    tipoPersona: 'Colaborador' as 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico',
    
    // Campos específicos para estudiantes
    grado: '',
    grupo: '',
    
    // Campos específicos para profesores
    nivelEducativo: 'General' as 'Transición' | 'Primaria' | 'Secundaria' | 'General',
    materias: [] as string[],
    
    observaciones: ''
  });

  // Obtener personas sin cuenta para la primera pestaña
  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      loadPersons();
    }
  }, [isOpen, activeTab]);

  const loadPersons = async () => {
    try {
      setLoadingPersons(true);
      const response = await getPersonsWithoutAccount();
      if (response.success && Array.isArray(response.data)) {
        setPersons(response.data);
      }
    } catch (error) {
      console.error('Error cargando personas:', error);
    } finally {
      setLoadingPersons(false);
    }
  };

  // Filtrar personas por búsqueda
  const filteredPersons = persons.filter(person =>
    person.nombre1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.nombre2 && person.nombre2.toLowerCase().includes(searchTerm.toLowerCase())) ||
    person.apellido1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.apellido2 && person.apellido2.toLowerCase().includes(searchTerm.toLowerCase())) ||
    person.doc.includes(searchTerm)
  );

  // Determinar roles disponibles según el usuario actual
  const availableRoles = () => {
    if (currentUserRole === 'superadmin' && isMasterSuperAdmin) {
      return [
        { value: 'user', label: 'Usuario Normal', description: 'Acceso básico al sistema' },
        { value: 'admin', label: 'Administrador', description: 'Gestión de usuarios y contenido' },
        { value: 'superadmin', label: 'SuperAdministrador', description: '⚠️ Control total del sistema' }
      ];
    } else if (currentUserRole === 'superadmin') {
      return [
        { value: 'user', label: 'Usuario Normal', description: 'Acceso básico al sistema' },
        { value: 'admin', label: 'Administrador', description: 'Gestión de usuarios y contenido' }
      ];
    } else {
      return [
        { value: 'user', label: 'Usuario Normal', description: 'Acceso básico al sistema' }
      ];
    }
  };

  // Generar contraseña aleatoria
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    
    // Asegurar al menos una mayúscula, una minúscula y un número
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // Completar con 3 caracteres aleatorios más
    for (let i = 3; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  // Manejar envío de formulario para persona existente
  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPersonId) {
      alert('Por favor selecciona una persona');
      return;
    }

    // Confirmación especial para roles administrativos
    if (selectedRole === 'superadmin') {
      const confirm = window.confirm(
        '⚠️ ¿Estás seguro de crear un SuperAdministrador?\n\n' +
        'Este usuario tendrá control total del sistema.\n' +
        'Solo el MasterSuperAdministrador puede realizar esta acción.'
      );
      if (!confirm) return;
    } else if (selectedRole === 'admin') {
      const confirm = window.confirm(
        '🔧 ¿Confirmas la creación de un Administrador?\n\n' +
        'Este usuario podrá gestionar otros usuarios y contenido del sistema.'
      );
      if (!confirm) return;
    }

    try {
      setLoading(true);
      
      const response = await createUser({
        personId: selectedPersonId,
        role: selectedRole,
        ...(customUsername && { customUsername })
      });

      if (response.success && response.data) {
        const selectedPerson = persons.find(p => p._id === selectedPersonId);
        const fullName = selectedPerson ? `${selectedPerson.nombre1} ${selectedPerson.nombre2 || ''} ${selectedPerson.apellido1} ${selectedPerson.apellido2 || ''}`.trim() : '';
        let successMessage = `Usuario creado exitosamente para ${fullName}`;
        
        if (selectedRole === 'superadmin') {
          successMessage = `⚠️ SuperAdministrador creado: ${response.data.credentials.username}`;
        } else if (selectedRole === 'admin') {
          successMessage = `🔧 Administrador creado: ${response.data.credentials.username}`;
        }

        // Mostrar credenciales
        alert(
          `${successMessage}\n\n` +
          `👤 Usuario: ${response.data.credentials.username}\n` +
          `🔑 Contraseña: ${response.data.credentials.password}\n` +
          `🎭 Rol: ${response.data.credentials.role}\n\n` +
          '⚠️ Guarda estas credenciales, la contraseña no se mostrará nuevamente.'
        );

        onSuccess(successMessage);
        resetForms();
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío de formulario para persona nueva
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!newUserData.username || !newUserData.password || !newUserData.doc || !newUserData.nombre1 || !newUserData.apellido1) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Confirmación especial para roles administrativos
    if (newUserData.role === 'superadmin') {
      const confirm = window.confirm(
        '⚠️ ¿Estás seguro de crear un SuperAdministrador?\n\n' +
        'Este usuario tendrá control total del sistema.\n' +
        'Solo el MasterSuperAdministrador puede realizar esta acción.'
      );
      if (!confirm) return;
    } else if (newUserData.role === 'admin') {
      const confirm = window.confirm(
        '🔧 ¿Confirmas la creación de un Administrador?\n\n' +
        'Este usuario podrá gestionar otros usuarios y contenido del sistema.'
      );
      if (!confirm) return;
    }

    try {
      setLoading(true);
      
      const response = await createUserWithPerson(newUserData);

      if (response.success && response.data) {
        const fullName = `${newUserData.nombre1} ${newUserData.nombre2 || ''} ${newUserData.apellido1} ${newUserData.apellido2 || ''}`.trim();
        let successMessage = `Usuario y persona creados exitosamente: ${fullName}`;
        
        if (newUserData.role === 'superadmin') {
          successMessage = `⚠️ SuperAdministrador y persona creados: ${response.data.credentials.username}`;
        } else if (newUserData.role === 'admin') {
          successMessage = `🔧 Administrador y persona creados: ${response.data.credentials.username}`;
        }

        // Mostrar credenciales
        alert(
          `${successMessage}\n\n` +
          `👤 Usuario: ${response.data.credentials.username}\n` +
          `🔑 Contraseña: ${response.data.credentials.password}\n` +
          `🎭 Rol: ${response.data.credentials.role}\n\n` +
          '⚠️ Guarda estas credenciales, la contraseña no se mostrará nuevamente.'
        );

        onSuccess(successMessage);
        resetForms();
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario y persona';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    // Reset primera pestaña
    setSelectedPersonId('');
    setSelectedRole('user');
    setCustomUsername('');
    setSearchTerm('');
    
    // Reset segunda pestaña
    setNewUserData({
      username: '',
      password: '',
      role: 'user',
      doc: '',
      tipoDoc: 'CC',
      nombre1: '',
      nombre2: '',
      apellido1: '',
      apellido2: '',
      genero: 'Masculino',
      fechaNacimiento: '',
      direccion: '',
      celular: '',
      email: '',
      tipoPersona: 'Colaborador',
      grado: '',
      grupo: '',
      nivelEducativo: 'General',
      materias: [],
      observaciones: ''
    });
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Crear Usuario</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'existing'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('existing')}
          >
            📋 Seleccionar Persona Existente
          </button>
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'new'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('new')}
          >
            ➕ Crear Persona y Usuario
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'existing' ? (
            // Pestaña: Seleccionar Persona Existente
            <form onSubmit={handleSubmitExisting} className="space-y-4">
              {/* Selector de Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin' | 'superadmin')}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableRoles().map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                
                {/* Descripción del rol seleccionado */}
                <p className="text-xs text-gray-600 mt-1">
                  {availableRoles().find(r => r.value === selectedRole)?.description}
                </p>
                
                {/* Advertencia para SuperAdmin */}
                {selectedRole === 'superadmin' && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <p className="text-xs text-red-800">
                      ⚠️ Solo el MasterSuperAdministrador puede crear SuperAdministradores.
                      Límite máximo: 3 SuperAdmins total.
                    </p>
                  </div>
                )}
              </div>

              {/* Buscador de personas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Persona
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o documento..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Lista de personas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Persona
                </label>
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                  {loadingPersons ? (
                    <div className="p-4 text-center text-gray-500">Cargando personas...</div>
                  ) : filteredPersons.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron personas' : 'No hay personas sin cuenta'}
                    </div>
                  ) : (
                    filteredPersons.map(person => (
                      <label
                        key={person._id}
                        className={`block p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          selectedPersonId === person._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="person"
                          value={person._id}
                          checked={selectedPersonId === person._id}
                          onChange={(e) => setSelectedPersonId(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">
                            {person.nombre1} {person.nombre2 || ''} {person.apellido1} {person.apellido2 || ''}
                          </div>
                          <div className="text-sm text-gray-600">
                            {person.doc} - {person.tipoPersona}
                            {person.grado && ` - ${person.grado}${person.grupo ? ` ${person.grupo}` : ''}`}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Username personalizado (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="Se generará automáticamente si se deja vacío"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedPersonId}
                  className={`flex-1 px-4 py-3 rounded-md text-white font-medium ${
                    loading || !selectedPersonId
                      ? 'bg-gray-400 cursor-not-allowed'
                      : selectedRole === 'superadmin'
                      ? 'bg-red-600 hover:bg-red-700'
                      : selectedRole === 'admin'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Creando...' : `Crear ${selectedRole === 'superadmin' ? 'SuperAdmin' : selectedRole === 'admin' ? 'Admin' : 'Usuario'}`}
                </button>
              </div>
            </form>
          ) : (
            // Pestaña: Crear Persona y Usuario
            <form onSubmit={handleSubmitNew} className="space-y-6">
              {/* Información del Usuario */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-4">👤 Información del Usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setNewUserData({...newUserData, password: generatePassword()})}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                        title="Generar contraseña"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol *
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'user' | 'admin' | 'superadmin'})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableRoles().map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-900 mb-4">🏷️ Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento *
                    </label>
                    <input
                      type="text"
                      value={newUserData.doc}
                      onChange={(e) => setNewUserData({...newUserData, doc: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Documento
                    </label>
                    <select
                      value={newUserData.tipoDoc}
                      onChange={(e) => setNewUserData({...newUserData, tipoDoc: e.target.value as 'CC' | 'NES' | 'PPT' | 'RC' | 'TI'})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="TI">Tarjeta de Identidad</option>
                      <option value="RC">Registro Civil</option>
                      <option value="NES">NES</option>
                      <option value="PPT">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Persona
                    </label>
                    <select
                      value={newUserData.tipoPersona}
                      onChange={(e) => setNewUserData({...newUserData, tipoPersona: e.target.value as 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico'})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Profesor">Profesor</option>
                      <option value="Estudiante">Estudiante</option>
                      <option value="Publico">Público</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primer Nombre *
                    </label>
                    <input
                      type="text"
                      value={newUserData.nombre1}
                      onChange={(e) => setNewUserData({...newUserData, nombre1: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      value={newUserData.nombre2}
                      onChange={(e) => setNewUserData({...newUserData, nombre2: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primer Apellido *
                    </label>
                    <input
                      type="text"
                      value={newUserData.apellido1}
                      onChange={(e) => setNewUserData({...newUserData, apellido1: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      value={newUserData.apellido2}
                      onChange={(e) => setNewUserData({...newUserData, apellido2: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género
                    </label>
                    <select
                      value={newUserData.genero}
                      onChange={(e) => setNewUserData({...newUserData, genero: e.target.value as 'Masculino' | 'Femenino'})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={newUserData.fechaNacimiento}
                      onChange={(e) => setNewUserData({...newUserData, fechaNacimiento: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-purple-900 mb-4">📞 Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      type="tel"
                      value={newUserData.celular}
                      onChange={(e) => setNewUserData({...newUserData, celular: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={newUserData.direccion}
                      onChange={(e) => setNewUserData({...newUserData, direccion: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Campos específicos para estudiantes */}
              {newUserData.tipoPersona === 'Estudiante' && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-900 mb-4">🎓 Información Académica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grado
                      </label>
                      <input
                        type="text"
                        value={newUserData.grado}
                        onChange={(e) => setNewUserData({...newUserData, grado: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: 6°, 7°, 8°, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grupo
                      </label>
                      <input
                        type="text"
                        value={newUserData.grupo}
                        onChange={(e) => setNewUserData({...newUserData, grupo: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: A, B, C, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={newUserData.observaciones}
                  onChange={(e) => setNewUserData({...newUserData, observaciones: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Información adicional sobre la persona..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-3 rounded-md text-white font-medium ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : newUserData.role === 'superadmin'
                      ? 'bg-red-600 hover:bg-red-700'
                      : newUserData.role === 'admin'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Creando...' : `Crear ${newUserData.role === 'superadmin' ? 'SuperAdmin' : newUserData.role === 'admin' ? 'Admin' : 'Usuario'} Completo`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
