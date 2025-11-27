import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { getPersons } from '../api/persons';
import type { Person } from '../types';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import CredencialesGeneradasModal from './CredencialesGeneradasModal';

interface CreateUsersByGradeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'superadmin' | 'admin';
}

const CreateUsersByGradeDashboardModal: React.FC<CreateUsersByGradeDashboardModalProps> = ({ isOpen, onClose, currentUserRole }) => {
  const [grado, setGrado] = useState<string>('');
  const [grupo, setGrupo] = useState<string>('');
  const [tipoPersona] = useState<'Estudiante'>('Estudiante'); // Fijado como Estudiante
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personasPorCrear, setPersonasPorCrear] = useState<number>(0);
  const [showCredencialesModal, setShowCredencialesModal] = useState(false);
  const [credencialesGeneradas, setCredencialesGeneradas] = useState<any[]>([]);

  const { showError, showWarning, showApiError, showApiSuccess } = useNotificationHelpers();

  console.log('🚀 [FRONTEND DEBUG] CreateUsersByGradeDashboardModal renderizado', { isOpen, grado, grupo, personasPorCrear, tipoPersona });

  // Cargar personas cuando se abra el modal
  useEffect(() => {
    console.log('🔄 [FRONTEND DEBUG] useEffect ejecutándose', { isOpen });
    if (isOpen) {
      console.log('🔄 [FRONTEND DEBUG] Modal abierto, cargando personas...');
      loadPersons();
    }
  }, [isOpen]);

  // Calcular cuántas personas del grado/grupo seleccionado no tienen cuenta
  useEffect(() => {
    if (grado && persons.length > 0) {
      const personasDelGradoGrupo = persons.filter(p =>
        p.grado === grado &&
        p.tipoPersona === tipoPersona &&
        !p.tieneCuenta &&
        p.estado !== 'Vetado' &&
        !('deletedAt' in p && p.deletedAt) &&
        (!grupo || p.grupo === grupo) // Filtrar por grupo si se especifica
      );
      setPersonasPorCrear(personasDelGradoGrupo.length);
      console.log(`📊 [FRONTEND DEBUG] Personas encontradas para crear: ${personasDelGradoGrupo.length}`);
    } else {
      setPersonasPorCrear(0);
    }
  }, [grado, grupo, tipoPersona, persons]);

  const loadPersons = async () => {
    try {
      console.log('🔄 [FRONTEND DEBUG] loadPersons ejecutándose');
      setLoading(true);
      const response = await getPersons();
      console.log('🔄 [FRONTEND DEBUG] getPersons response:', response);
      if (response.success) {
        setPersons(response.data || []);
        console.log(`🔄 [FRONTEND DEBUG] ${response.data?.length || 0} personas cargadas`);
      }
    } catch (error) {
      console.error('❌ [FRONTEND DEBUG] Error al cargar personas:', error);
      showError('Error al Cargar Datos', 'No se pudieron cargar las personas. Verifica tu conexión.');
      alert('Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('🎯 [FRONTEND DEBUG] handleSubmit ejecutándose', { grado, grupo, personasPorCrear });

    if (!grado) {
      showWarning('Campo Requerido', 'Selecciona un grado antes de continuar.');
      return;
    }

    if (personasPorCrear === 0) {
      const grupoText = grupo ? ` y grupo ${grupo}` : '';
      showWarning('Sin Personas', `No hay personas del grado ${grado}${grupoText} (${tipoPersona}) sin cuenta de usuario.`);
      return;
    }

    const grupoText = grupo ? ` y grupo ${grupo}` : '';
    if (!confirm(`¿Estás seguro de que quieres crear ${personasPorCrear} usuarios para el grado ${grado}${grupoText}?`)) {
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');

      const requestData = {
        grado,
        tipoPersona: 'Estudiante', // Enviar explícitamente como Estudiante
        grupo: grupo || undefined, // Solo enviar grupo si está especificado
        role: currentUserRole === 'superadmin' ? 'user' : 'user' // Admin solo puede crear users, SuperAdmin también crea users
      };

      console.log('🔄 [FRONTEND DEBUG] Enviando datos:', requestData);
      console.log(`🔄 [FRONTEND DEBUG] Personas que deberían crearse según frontend: ${personasPorCrear}`);

      const response = await fetch('${API_BASE_URL}/auth/create-users-by-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      console.log('🔄 [FRONTEND DEBUG] Respuesta recibida:', data);
      console.log('🔍 [FRONTEND DEBUG] data.createdUsers:', data.createdUsers);
      console.log('🔍 [FRONTEND DEBUG] Tiene createdUsers?', !!data.createdUsers);
      console.log('🔍 [FRONTEND DEBUG] Length:', data.createdUsers?.length);

      if (data.success) {
        showApiSuccess(data.message);

        // Mostrar detalles adicionales si hay información de debug
        if (data.debug) {
          console.log('🔍 [DEBUG INFO]', data.debug);
        }

        // Si hubo errores pero algunos usuarios se crearon, mostrar warning
        if (data.errors && data.errors.length > 0) {
          showWarning('Creación Parcial', `${data.createdCount} usuarios creados, pero ${data.errors.length} tuvieron errores.`);
        }

        // Si se crearon usuarios, mostrar modal de credenciales
        console.log('⚠️ [FRONTEND DEBUG] Verificando condición para mostrar modal...');
        if (data.createdUsers && data.createdUsers.length > 0) {
          console.log('✅ [FRONTEND DEBUG] Condición cumplida, mostrando modal de credenciales');
          
          // Mostrar mensaje de éxito visible
          showApiSuccess(`✅ ${data.createdCount} usuarios registrados exitosamente`);
          
          setCredencialesGeneradas(data.createdUsers);
          setShowCredencialesModal(true);
          setCreating(false);
          
          // Cerrar el modal actual después de un breve delay
          setTimeout(() => {
            onClose();
          }, 500);
        } else {
          showApiSuccess('Proceso completado');
          onClose();
          // Recargar la página para actualizar estadísticas
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        // Error específico del servidor
        showApiError(data, 'Error al crear usuarios');

        // Si hay errores detallados, mostrarlos en consola para debugging
        if (data.errors && data.errors.length > 0) {
          console.error('❌ [FRONTEND DEBUG] Errores detallados del servidor:', data.errors);
        }

        // Si todos los usuarios tuvieron errores de validación, mostrar mensaje específico
        if (data.errors && data.errors.length > 0 && data.createdCount === 0) {
          showError('Error de Validación',
            `Todos los usuarios tuvieron errores de validación. Revisa que las personas tengan todos los campos requeridos.`);
        }
      }
    } catch (error) {
      console.error('❌ [FRONTEND DEBUG] Error creando usuarios:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('Error de Conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        showApiError(error, 'Error inesperado al crear usuarios');
      }
    } finally {
      setCreating(false);
    }
  };

  const getUniqueGrados = () => {
    const activePersons = persons.filter(p =>
      !('deletedAt' in p && p.deletedAt) &&
      p.tipoPersona === 'Estudiante'
    );
    const gradosSet = new Set(activePersons.map(p => p.grado).filter(g => g && g.trim() !== ''));
    const grados = Array.from(gradosSet);
    return grados.sort();
  };

  const getUniqueGrupos = () => {
    if (!grado) return [];
    const activePersons = persons.filter(p =>
      !('deletedAt' in p && p.deletedAt) &&
      p.tipoPersona === 'Estudiante' &&
      p.grado === grado
    );
    const gruposSet = new Set(activePersons.map(p => p.grupo).filter(g => g && g.trim() !== ''));
    const grupos = Array.from(gruposSet);
    return grupos.sort();
  };

  if (!isOpen) {
    console.log('❌ [FRONTEND DEBUG] Modal cerrado, retornando null');
    return null;
  }

  console.log('✅ [FRONTEND DEBUG] Modal abierto, renderizando contenido');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Ocultar el modal de creación cuando está abierto el modal de credenciales */}
      {!showCredencialesModal && (
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Crear Usuarios por Grado</h3>
          <button onClick={() => {
            console.log('❌ [FRONTEND DEBUG] Botón cerrar clickeado');
            onClose();
          }} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          {/* Grado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grado <span className="text-red-500">*</span>
            </label>
            <select
              value={grado}
              onChange={(e) => {
                setGrado(e.target.value);
                setGrupo(''); // Reset grupo cuando cambia el grado
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Selecciona un grado --</option>
              {getUniqueGrados().map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Grupo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupo <span className="text-gray-500">(opcional)</span>
            </label>
            <select
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || !grado}
            >
              <option value="">-- Todos los grupos --</option>
              {getUniqueGrupos().map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Información */}
          {loading && (
            <div className="text-sm text-gray-600">
              Cargando personas...
            </div>
          )}

          {grado && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm text-blue-800">
                <strong>Información:</strong>
              </div>
              <div className="text-sm text-blue-700 mt-1">
                • Personas del grado {grado}{grupo ? `, grupo ${grupo}` : ''} ({tipoPersona}): {personasPorCrear} sin cuenta
              </div>
              <div className="text-sm text-blue-700">
                • Se crearán usuarios con username = documento y contraseña = documento
              </div>
              <div className="text-sm text-blue-700">
                • Todos los usuarios creados tendrán rol: <strong>usuario</strong>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!grado || personasPorCrear === 0 || creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creando...' : `Crear ${personasPorCrear} usuarios`}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Modal de Credenciales Generadas */}
      <CredencialesGeneradasModal
        isOpen={showCredencialesModal}
        onClose={() => {
          console.log('🔴 [FRONTEND DEBUG] Cerrando modal de credenciales');
          setShowCredencialesModal(false);
          onClose(); // Cerrar también el modal de creación
          // Recargar la página después de cerrar el modal de credenciales
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }}
        credenciales={credencialesGeneradas}
        grado={grado}
        grupo={grupo}
      />
    </div>
  );
};

export default CreateUsersByGradeDashboardModal;
