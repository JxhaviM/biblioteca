import React, { useState } from 'react';
import { createPerson } from '../api/persons';

interface CreatePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface PersonFormData {
  doc: string;
  tipoDoc: 'CC' | 'NES' | 'PPT' | 'RC' | 'TI';
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  genero: 'Masculino' | 'Femenino';
  fechaNacimiento: string;
  direccion: string;
  celular: string;
  email: string;
  tipoPersona: 'Estudiante' | 'Profesor' | 'Colaborador' | 'Publico';
  grado: string;
  grupo: string;
  nivelEducativo: 'Transición' | 'Primaria' | 'Secundaria' | 'General';
  materias: string[];
  observaciones: string;
}

const CreatePersonModal: React.FC<CreatePersonModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PersonFormData>({
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

  const [currentMateria, setCurrentMateria] = useState('');

  const handleInputChange = (field: keyof PersonFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMateria = () => {
    if (currentMateria.trim() && !formData.materias.includes(currentMateria.trim())) {
      setFormData(prev => ({
        ...prev,
        materias: [...prev.materias, currentMateria.trim()]
      }));
      setCurrentMateria('');
    }
  };

  const removeMateria = (materia: string) => {
    setFormData(prev => ({
      ...prev,
      materias: prev.materias.filter(m => m !== materia)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.doc || !formData.nombre1 || !formData.apellido1) {
      alert('Por favor completa todos los campos requeridos (Documento, Primer Nombre, Primer Apellido)');
      return;
    }

    // Validación específica para estudiantes
    if (formData.tipoPersona === 'Estudiante' && (!formData.grado || !formData.grupo)) {
      alert('Para estudiantes, el grado y grupo son requeridos');
      return;
    }

    // Validación específica para profesores
    if (formData.tipoPersona === 'Profesor' && formData.materias.length === 0) {
      alert('Para profesores, debe especificar al menos una materia');
      return;
    }

    try {
      setLoading(true);
      
      const response = await createPerson(formData);

      if (response.success && response.data) {
        const fullName = `${formData.nombre1} ${formData.nombre2 || ''} ${formData.apellido1} ${formData.apellido2 || ''}`.trim();
        const successMessage = `Persona registrada exitosamente: ${fullName}`;
        
        alert(successMessage);
        onSuccess(successMessage);
        resetForm();
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar persona';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setCurrentMateria('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            👥 Registrar Nueva Persona
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal Básica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.tipoDoc}
                  onChange={(e) => handleInputChange('tipoDoc', e.target.value as PersonFormData['tipoDoc'])}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="RC">Registro Civil</option>
                  <option value="NES">Número Especial de Estudiante</option>
                  <option value="PPT">Pasaporte</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  value={formData.doc}
                  onChange={(e) => handleInputChange('doc', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primer Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre1}
                  onChange={(e) => handleInputChange('nombre1', e.target.value)}
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
                  value={formData.nombre2}
                  onChange={(e) => handleInputChange('nombre2', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primer Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellido1}
                  onChange={(e) => handleInputChange('apellido1', e.target.value)}
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
                  value={formData.apellido2}
                  onChange={(e) => handleInputChange('apellido2', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género
                </label>
                <select
                  value={formData.genero}
                  onChange={(e) => handleInputChange('genero', e.target.value as PersonFormData['genero'])}
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
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-4">📞 Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Celular
                </label>
                <input
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => handleInputChange('celular', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tipo de Persona */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-900 mb-4">🎭 Tipo de Persona</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Persona *
              </label>
              <select
                value={formData.tipoPersona}
                onChange={(e) => handleInputChange('tipoPersona', e.target.value as PersonFormData['tipoPersona'])}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Estudiante">Estudiante</option>
                <option value="Profesor">Profesor</option>
                <option value="Colaborador">Colaborador</option>
                <option value="Publico">Público General</option>
              </select>
            </div>

            {/* Campos específicos para Estudiantes */}
            {formData.tipoPersona === 'Estudiante' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grado *
                  </label>
                  <input
                    type="text"
                    value={formData.grado}
                    onChange={(e) => handleInputChange('grado', e.target.value)}
                    placeholder="Ej: 5°, 10°, 11°"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo *
                  </label>
                  <input
                    type="text"
                    value={formData.grupo}
                    onChange={(e) => handleInputChange('grupo', e.target.value)}
                    placeholder="Ej: A, B, C"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Campos específicos para Profesores */}
            {formData.tipoPersona === 'Profesor' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Educativo
                  </label>
                  <select
                    value={formData.nivelEducativo}
                    onChange={(e) => handleInputChange('nivelEducativo', e.target.value as PersonFormData['nivelEducativo'])}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Transición">Transición</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Materias que enseña *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentMateria}
                        onChange={(e) => setCurrentMateria(e.target.value)}
                        placeholder="Escriba una materia y presione Agregar"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMateria())}
                      />
                      <button
                        type="button"
                        onClick={addMateria}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.materias.map(materia => (
                        <span
                          key={materia}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {materia}
                          <button
                            type="button"
                            onClick={() => removeMateria(materia)}
                            className="ml-2 text-blue-600 hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-900 mb-4">📝 Observaciones</h3>
            <textarea
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Información adicional relevante..."
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                  </svg>
                  <span>Registrando...</span>
                </>
              ) : (
                <span>👥 Registrar Persona</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePersonModal;
