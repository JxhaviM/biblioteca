import React, { useState, useEffect } from 'react';
import type { CreateAdminData } from '../api/auth';

interface AdminFormProps {
  onSubmit: (data: CreateAdminData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  submitButtonText?: string;
  title?: string;
  showTitle?: boolean;
  onCancel?: () => void;
  resetTrigger?: boolean; // Nueva prop para forzar reset desde el padre
}

const AdminForm: React.FC<AdminFormProps> = ({
  onSubmit,
  loading,
  error,
  submitButtonText = 'Crear Administrador',
  title = 'Crear Nuevo Administrador',
  showTitle = false,
  onCancel,
  resetTrigger = false
}) => {
  // Estado inicial del formulario - usar callback para evitar recreación
  const getInitialFormData = (): CreateAdminData => ({
    doc: '',
    tipoDoc: 'CC',
    apellido1: '',
    apellido2: '',
    nombre1: '',
    nombre2: '',
    genero: 'Masculino',
    username: '',
    password: '',
    email: '',
    telefono: ''
  });

  const [formData, setFormData] = useState<CreateAdminData>(getInitialFormData);

  // Efecto para limpiar el formulario cuando se monta el componente
  useEffect(() => {
    // Debug: Verificar si hay datos no deseados
    console.log('🔧 AdminForm montado - Estado inicial:', getInitialFormData());
    
    // Asegurar que el formulario esté limpio al montarse
    setFormData(getInitialFormData());
  }, []); // Solo se ejecuta al montar

  // Efecto para limpiar el formulario cuando el padre lo solicite
  useEffect(() => {
    if (resetTrigger) {
      console.log('🔧 AdminForm reset por trigger del padre');
      setFormData(getInitialFormData());
    }
  }, [resetTrigger]); // Se ejecuta cuando resetTrigger cambia

  // Debug: Monitorear cambios en formData
  useEffect(() => {
    console.log('🔧 AdminForm - Datos del formulario:', formData);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔧 AdminForm - Datos del formulario antes de enviar:', formData);
    console.log('🔧 AdminForm - Campos requeridos check:');
    console.log('- doc:', formData.doc);
    console.log('- nombre1:', formData.nombre1);
    console.log('- apellido1:', formData.apellido1);
    console.log('- username:', formData.username);
    console.log('- password:', formData.password);
    
    const success = await onSubmit(formData);
    
    if (success) {
      console.log('🔧 AdminForm - Administrador creado exitosamente, limpiando formulario');
      // Limpiar formulario en caso de éxito
      setFormData(getInitialFormData());
    } else {
      console.log('🔧 AdminForm - Error al crear administrador');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      )}
      
      {/* Advertencia clara sobre crear nuevo administrador */}
      <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2">
            <p className="text-xs font-medium">
              ℹ️ Creando <strong>NUEVO administrador</strong> independiente
            </p>
            <p className="text-xs text-blue-600">
              Datos no relacionados con su cuenta actual
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* Información Personal */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">Información Personal</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {/* Documento */}
            <div>
              <input
                type="text"
                id="doc"
                name="doc"
                value={formData.doc}
                onChange={handleChange}
                required
                placeholder="Documento *"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Tipo de Documento */}
            <div>
              <select
                id="tipoDoc"
                name="tipoDoc"
                value={formData.tipoDoc}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="CE">CE</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>

            {/* Género */}
            <div>
              <select
                id="genero"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            {/* Placeholder para alineación */}
            <div className="hidden lg:block"></div>

            {/* Primer Nombre */}
            <div>
              <input
                type="text"
                id="nombre1"
                name="nombre1"
                value={formData.nombre1}
                onChange={handleChange}
                required
                placeholder="Primer Nombre *"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Segundo Nombre */}
            <div>
              <input
                type="text"
                id="nombre2"
                name="nombre2"
                value={formData.nombre2}
                onChange={handleChange}
                placeholder="Segundo Nombre"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Primer Apellido */}
            <div>
              <input
                type="text"
                id="apellido1"
                name="apellido1"
                value={formData.apellido1}
                onChange={handleChange}
                required
                placeholder="Primer Apellido *"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Segundo Apellido */}
            <div>
              <input
                type="text"
                id="apellido2"
                name="apellido2"
                value={formData.apellido2}
                onChange={handleChange}
                placeholder="Segundo Apellido"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Información de Cuenta */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">Información de Cuenta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Username */}
            <div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Usuario * (diferente al suyo)"
                autoComplete="new-username"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Contraseña *"
                autoComplete="new-password"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Email */}
            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email (opcional)"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Teléfono (opcional)"
                autoComplete="off"
                data-form-type="other"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </div>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;
