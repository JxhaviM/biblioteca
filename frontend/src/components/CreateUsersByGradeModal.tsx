import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { getPersons } from '../api/persons';
import type { Person } from '../types';

interface CreateUsersByGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateUsersByGradeModal: React.FC<CreateUsersByGradeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [grado, setGrado] = useState<string>('');
  const [tipoPersona, setTipoPersona] = useState<'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico'>('Estudiante');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personasPorCrear, setPersonasPorCrear] = useState<number>(0);

  // Cargar personas cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      loadPersons();
    }
  }, [isOpen]);

  // Calcular cuántas personas del grado seleccionado no tienen cuenta
  useEffect(() => {
    if (grado && persons.length > 0) {
      const personasDelGrado = persons.filter(p =>
        p.grado === grado &&
        p.tipoPersona === tipoPersona &&
        !p.tieneCuenta &&
        p.estado !== 'Vetado' &&
        !('deletedAt' in p && p.deletedAt)
      );
      setPersonasPorCrear(personasDelGrado.length);
    } else {
      setPersonasPorCrear(0);
    }
  }, [grado, tipoPersona, persons]);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await getPersons();
      if (response.success) {
        setPersons(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar personas:', error);
      alert('Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!grado) {
      alert('Selecciona un grado');
      return;
    }

    if (personasPorCrear === 0) {
      alert('No hay personas del grado seleccionado sin cuenta de usuario');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres crear ${personasPorCrear} usuarios para el grado ${grado}?`)) {
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');

      const response = await fetch('${API_BASE_URL}/users/bulk-by-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          grado,
          tipoPersona
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creando usuarios:', error);
      alert('Error al crear usuarios');
    } finally {
      setCreating(false);
    }
  };

  const getUniqueGrados = () => {
    const activePersons = persons.filter(p => !('deletedAt' in p && p.deletedAt));
    const grados = [...new Set(activePersons.map(p => p.grado).filter(g => g && g.trim() !== ''))];
    return grados.sort();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Crear Usuarios por Grado</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          {/* Tipo de Persona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Persona
            </label>
            <select
              value={tipoPersona}
              onChange={(e) => setTipoPersona(e.target.value as 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Estudiante">Estudiante</option>
              <option value="Profesor">Profesor</option>
              <option value="Colaborador">Colaborador</option>
              <option value="Publico">Público</option>
            </select>
          </div>

          {/* Grado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grado
            </label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Selecciona un grado --</option>
              {getUniqueGrados().map(g => (
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
                • Personas del grado {grado} ({tipoPersona}): {personasPorCrear} sin cuenta
              </div>
              <div className="text-sm text-blue-700">
                • Se crearán usuarios con username = documento y contraseña = documento
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
    </div>
  );
};

export default CreateUsersByGradeModal;
