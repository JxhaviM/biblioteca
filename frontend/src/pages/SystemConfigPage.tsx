import React, { useState, useEffect } from 'react';
import { getConfig, updateConfig } from '../api/system';

const SystemConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedConfig, setEditedConfig] = useState<any>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getConfig();
      setEditedConfig(response.config);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      alert('Error al cargar la configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (seccion: string) => {
    try {
      setSaving(true);
      await updateConfig(seccion, editedConfig[seccion]);
      alert('✅ Configuración actualizada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (seccion: string, campo: string, valor: any) => {
    // Convertir valores numéricos correctamente
    let valorProcesado = valor;
    if (typeof valor === 'string') {
      // Si es un input numérico y está vacío, usar 0 o el valor por defecto
      if (valor === '') {
        // Para campos numéricos específicos, usar valores por defecto
        if (campo === 'diasMaximo') valorProcesado = 15;
        else if (campo === 'multaDiaria') valorProcesado = 1000;
        else if (campo === 'maximoPorUsuario') valorProcesado = 3;
        else if (campo === 'intentosMaximos') valorProcesado = 5;
        else if (campo === 'duracionSesion') valorProcesado = 24;
        else if (campo === 'itemsPorPagina') valorProcesado = 30;
        else valorProcesado = 0;
      } else if (!isNaN(Number(valor))) {
        valorProcesado = Number(valor);
      }
    }
    
    setEditedConfig({
      ...editedConfig,
      [seccion]: {
        ...editedConfig[seccion],
        [campo]: valorProcesado
      }
    });
  };

  if (loading) {
    return (
    
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Cargando configuración...</p>
          </div>
    
        </div>
    
      </div>
    
    );
  }

  return (
    
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración Global</h1>
              <p className="text-gray-600 mt-2">Ajustes generales del sistema</p>
            </div>
    
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ← Volver
            </button>
          </div>
    
        </div>

        <div className="space-y-6">
          {/* Sistema */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">🖥️</span>
                Configuración del Sistema
              </h2>
            </div>
    
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Sistema</label>
                <input
                  type="text"
                  value={editedConfig?.sistema?.nombre || ''}
                  onChange={(e) => handleChange('sistema', 'nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Versión</label>
                <input
                  type="text"
                  value={editedConfig?.sistema?.version || ''}
                  onChange={(e) => handleChange('sistema', 'version', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
    
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedConfig?.sistema?.mantenimiento || false}
                  onChange={(e) => handleChange('sistema', 'mantenimiento', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Modo Mantenimiento</label>
              </div>
    
              <button
                onClick={() => handleSave('sistema')}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
    
          </div>

          {/* Préstamos */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">📚</span>
                Configuración de Préstamos
              </h2>
            </div>
    
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Días Máximo de Préstamo</label>
                <input
                  type="number"
                  value={editedConfig?.prestamos?.diasMaximo || 15}
                  onChange={(e) => handleChange('prestamos', 'diasMaximo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Multa Diaria ($)</label>
                <input
                  type="number"
                  value={editedConfig?.prestamos?.multaDiaria || 1000}
                  onChange={(e) => handleChange('prestamos', 'multaDiaria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Préstamos por Usuario</label>
                <input
                  type="number"
                  value={editedConfig?.prestamos?.maximoPorUsuario || 3}
                  onChange={(e) => handleChange('prestamos', 'maximoPorUsuario', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
    
              <button
                onClick={() => handleSave('prestamos')}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
    
          </div>

          {/* Usuarios */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">👥</span>
                Configuración de Usuarios
              </h2>
            </div>
    
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedConfig?.usuarios?.cambiarPasswordPrimeraVez || false}
                  onChange={(e) => handleChange('usuarios', 'cambiarPasswordPrimeraVez', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Obligar cambio de contraseña en primera vez</label>
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intentos Máximos de Login</label>
                <input
                  type="number"
                  value={editedConfig?.usuarios?.intentosMaximos || 5}
                  onChange={(e) => handleChange('usuarios', 'intentosMaximos', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración de Sesión (horas)</label>
                <input
                  type="number"
                  value={editedConfig?.usuarios?.duracionSesion || 24}
                  onChange={(e) => handleChange('usuarios', 'duracionSesion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
    
              <button
                onClick={() => handleSave('usuarios')}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
    
          </div>

          {/* Personas */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">👤</span>
                Configuración de Personas
              </h2>
            </div>
    
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items por Página</label>
                <input
                  type="number"
                  value={editedConfig?.personas?.itemsPorPagina || 30}
                  onChange={(e) => handleChange('personas', 'itemsPorPagina', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                />
              </div>
    
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedConfig?.personas?.permitirDuplicados || false}
                  onChange={(e) => handleChange('personas', 'permitirDuplicados', e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Permitir Documentos Duplicados</label>
              </div>
    
              <button
                onClick={() => handleSave('personas')}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
    
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">📧</span>
                Configuración de Emails
              </h2>
            </div>
    
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedConfig?.email?.notificaciones || false}
                  onChange={(e) => handleChange('email', 'notificaciones', e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Enviar Notificaciones por Email</label>
              </div>
    
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedConfig?.email?.recordatorios || false}
                  onChange={(e) => handleChange('email', 'recordatorios', e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Enviar Recordatorios de Préstamos</label>
              </div>
    
              <button
                onClick={() => handleSave('email')}
                disabled={saving}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
    
          </div>
    
        </div>

          {/* Footer */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-800 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">📄</span>
                Configuración del Footer
              </h2>
            </div>
    
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo del Footer (URL o dejar vacío para usar BT)</label>
                <input
                  type="text"
                  value={editedConfig?.footer?.logo || ''}
                  onChange={(e) => handleChange('footer', 'logo', e.target.value)}
                  placeholder="https://ejemplo.com/logo.png o dejar vacío"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Si no se especifica, se usará el logo "BT" por defecto</p>
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Texto del Desarrollado por</label>
                <input
                  type="text"
                  value={editedConfig?.footer?.desarrolladoPor || '1102 PROM 2025'}
                  onChange={(e) => handleChange('footer', 'desarrolladoPor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año del Copyright</label>
                <input
                  type="text"
                  value={editedConfig?.footer?.anio || '2025'}
                  onChange={(e) => handleChange('footer', 'anio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Institución</label>
                <input
                  type="text"
                  value={editedConfig?.footer?.institucion || 'I.E. San Pedro Claver'}
                  onChange={(e) => handleChange('footer', 'institucion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                />
              </div>
    
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedConfig?.footer?.mostrarLogo !== false}
                  onChange={(e) => handleChange('footer', 'mostrarLogo', e.target.checked)}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Mostrar Logo en el Footer</label>
              </div>
    
              <button
                onClick={() => handleSave('footer')}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
    
          </div>
    
        </div>
    
      </div>
    
  );
};

export default SystemConfigPage;
