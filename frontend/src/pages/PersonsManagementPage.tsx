import React, { useState, useEffect } from 'react';
import { getPersons } from '../api/persons';
import CreatePersonModal from '../components/CreatePersonModal';
import type { Person } from '../types';

const PersonsManagementPage: React.FC = () => {
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
      if (response.success && response.data) {
        setPersons(response.data);
      }
    } catch (error) {
      console.error('Error al cargar personas:', error);
      alert('Error al cargar la lista de personas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (message: string) => {
    console.log(message);
    loadPersons(); // Recargar la lista
  };

  // Filtrar personas
  const filteredPersons = persons.filter(person => {
    const matchesSearch = searchTerm === '' || 
      `${person.nombre1} ${person.nombre2 || ''} ${person.apellido1} ${person.apellido2 || ''} ${person.doc}`
        .toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || person.tipoPersona === filterType;
    
    return matchesSearch && matchesType && !person.deletedAt;
  });

  const getPersonTypeStats = () => {
    const stats = {
      total: persons.filter(p => !p.deletedAt).length,
      Estudiante: persons.filter(p => p.tipoPersona === 'Estudiante' && !p.deletedAt).length,
      Profesor: persons.filter(p => p.tipoPersona === 'Profesor' && !p.deletedAt).length,
      Colaborador: persons.filter(p => p.tipoPersona === 'Colaborador' && !p.deletedAt).length,
      Publico: persons.filter(p => p.tipoPersona === 'Publico' && !p.deletedAt).length
    };
    return stats;
  };

  const stats = getPersonTypeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
          </svg>
          <span className="text-lg text-gray-600">Cargando personas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👥 Gestión de Personas
          </h1>
          <p className="text-gray-600">
            Administra el registro de todas las personas en el sistema
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Personas</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{stats.Estudiante}</div>
            <div className="text-sm text-gray-600">Estudiantes</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">{stats.Profesor}</div>
            <div className="text-sm text-gray-600">Profesores</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600">{stats.Colaborador}</div>
            <div className="text-sm text-gray-600">Colaboradores</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
            <div className="text-2xl font-bold text-gray-600">{stats.Publico}</div>
            <div className="text-sm text-gray-600">Público</div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Buscador */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Filtro por tipo */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="Estudiante">Estudiantes</option>
                  <option value="Profesor">Profesores</option>
                  <option value="Colaborador">Colaboradores</option>
                  <option value="Publico">Público</option>
                </select>
              </div>
            </div>

            {/* Botón crear */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Registrar Persona</span>
            </button>
          </div>
        </div>

        {/* Lista de personas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Lista de Personas ({filteredPersons.length})
            </h2>
          </div>

          {filteredPersons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || filterType !== 'all' ? 
                'No se encontraron personas con los criterios especificados' : 
                'No hay personas registradas'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Información Específica
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPersons.map((person) => (
                    <tr key={person._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div>{person.doc}</div>
                          <div className="text-xs text-gray-500">{person.tipoDoc}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {person.nombre1} {person.nombre2 || ''} {person.apellido1} {person.apellido2 || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {person.genero && `${person.genero}`}
                          {person.fechaNacimiento && ` • ${new Date(person.fechaNacimiento).toLocaleDateString()}`}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.tipoPersona === 'Estudiante' && (
                          <div>
                            <div>Grado: {person.grado}</div>
                            <div>Grupo: {person.grupo}</div>
                          </div>
                        )}
                        {person.tipoPersona === 'Profesor' && (
                          <div>
                            <div>Nivel: {person.nivelEducativo}</div>
                            <div className="text-xs text-gray-500">
                              Materias: {person.materias?.length || 0}
                            </div>
                          </div>
                        )}
                        {(person.tipoPersona === 'Colaborador' || person.tipoPersona === 'Publico') && (
                          <div className="text-gray-500">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {person.celular && <div>📱 {person.celular}</div>}
                          {person.email && <div>📧 {person.email}</div>}
                          {person.direccion && <div className="text-xs text-gray-500">📍 {person.direccion}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de crear persona */}
      <CreatePersonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default PersonsManagementPage;
