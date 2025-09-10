import React, { useState, useEffect } from 'react';
import { getPersons } from '../api/persons';
import CreatePersonModal from '../components/CreatePersonModal';
import type { Person } from '../types';

const PersonManagementPage: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await getPersons();
      if (response.success) {
        setPersons(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (message: string) => {
    // Recargar la lista después de crear una persona
    await loadPersons();
    setIsCreateModalOpen(false);
    // Opcionalmente mostrar mensaje de éxito
    console.log(message);
  };

  // Filtrar personas
  const filteredPersons = persons.filter(person => {
    // Filtrar por término de búsqueda
    const matchesSearch = 
      (person.nombre1 && person.nombre1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.apellido1 && person.apellido1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.doc && person.doc.includes(searchTerm)) ||
      (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtrar por tipo
    const matchesType = filterType === 'all' || person.tipoPersona === filterType;

    // Filtrar por estado (no eliminadas)
    const isActive = !person.deletedAt;

    return matchesSearch && matchesType && isActive;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Personas
          </h1>
          <p className="text-gray-600">
            Administra el registro de personas en el sistema
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Registrar Persona</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, apellido, documento o email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Persona
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="Estudiante">Estudiantes</option>
              <option value="Profesor">Profesores</option>
              <option value="Colaborador">Colaboradores</option>
              <option value="Publico">Público General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">
            {filteredPersons.length}
          </div>
          <div className="text-sm text-gray-600">Total Personas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {filteredPersons.filter(p => p.tipoPersona === 'Estudiante').length}
          </div>
          <div className="text-sm text-gray-600">Estudiantes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {filteredPersons.filter(p => p.tipoPersona === 'Profesor').length}
          </div>
          <div className="text-sm text-gray-600">Profesores</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {filteredPersons.filter(p => p.tipoPersona === 'Colaborador').length}
          </div>
          <div className="text-sm text-gray-600">Colaboradores</div>
        </div>
      </div>

      {/* Lista de personas */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información Específica
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPersons.map((person) => (
                <tr key={person._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {person.nombre1 || ''} {person.nombre2 && person.nombre2} {person.apellido1 || ''} {person.apellido2 && person.apellido2}
                      </div>
                      <div className="text-sm text-gray-500">
                        {person.genero && `${person.genero}`}
                        {person.fechaNacimiento && ` • ${new Date(person.fechaNacimiento).toLocaleDateString()}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.doc || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{person.tipoDoc || 'CC'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      person.tipoPersona === 'Estudiante' ? 'bg-green-100 text-green-800' :
                      person.tipoPersona === 'Profesor' ? 'bg-purple-100 text-purple-800' :
                      person.tipoPersona === 'Colaborador' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {person.tipoPersona}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {person.celular && <div>📱 {person.celular}</div>}
                      {person.email && <div>📧 {person.email}</div>}
                      {person.direccion && <div>🏠 {person.direccion}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {person.tipoPersona === 'Estudiante' && (
                        <div>
                          {person.grado && <div>Grado: {person.grado}</div>}
                          {person.grupo && <div>Grupo: {person.grupo}</div>}
                        </div>
                      )}
                      {person.tipoPersona === 'Profesor' && person.materias && person.materias.length > 0 && (
                        <div>
                          <div>Materias:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {person.materias.map((materia, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {materia}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPersons.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'No se encontraron personas que coincidan con los filtros.'
                  : 'No hay personas registradas.'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de crear persona */}
      <CreatePersonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreatePerson}
      />
    </div>
  );
};

export default PersonManagementPage;
