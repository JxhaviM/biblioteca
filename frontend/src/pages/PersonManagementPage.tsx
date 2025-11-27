import React, { useState, useEffect } from 'react';
import { getPersons } from '../api/persons';
import CreatePersonModal from '../components/CreatePersonModal';
import PersonsTable from '../components/PersonsTable';
import BulkUploadModal from '../components/BulkUploadModal';
import type { User, Person } from '../api/auth';
import type { Person as PersonType } from '../types';

const PersonManagementPage: React.FC = () => {
  // Estados para Navbar
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedPerson = localStorage.getItem('person');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPerson) setPerson(JSON.parse(savedPerson) as Person);
  }, []);

  const [persons, setPersons] = useState<PersonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGrado, setFilterGrado] = useState<string>('all');
  const [filterGrupo, setFilterGrupo] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadPersons();
  }, []);

  // Reset página cuando cambien los filtros de búsqueda o tipo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const loadPersons = async () => {
    try {
      setLoading(true);
      console.log('Obteniendo token del localStorage...');
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', token ? 'Sí' : 'No');
      
      console.log('Solicitando personas...');
      const response = await getPersons();
      console.log('Respuesta de la API:', response);
      
      if (response && response.success) {
        console.log('Personas cargadas:', response.data?.length || 0);
        setPersons(response.data || []);
      } else {
        console.error('Error en la respuesta:', response?.message || 'Respuesta no exitosa');
      }
    } catch (error: any) {
      console.error('Error al cargar personas:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      // Mostrar mensaje de error al usuario
      alert(`Error al cargar personas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (message: string) => {
    await loadPersons();
    setIsCreateModalOpen(false);
    // Opcional: mostrar mensaje de éxito
    console.log(message);
  };

  // Estadísticas dinámicas basadas en las personas cargadas
  const getStats = () => {
    const activePersons = persons.filter(p => !('deletedAt' in p && p.deletedAt));
    return {
      total: activePersons.length,
      estudiantes: activePersons.filter(p => p.tipoPersona === 'Estudiante').length,
      profesores: activePersons.filter(p => p.tipoPersona === 'Profesor').length,
      colaboradores: activePersons.filter(p => p.tipoPersona === 'Colaborador').length,
    };
  };

  const stats = getStats();

  // Funciones para obtener opciones únicas
  const getUniqueGrados = () => {
    const activePersons = persons.filter(p => !('deletedAt' in p && p.deletedAt));
    const grados = [...new Set(activePersons.map(p => p.grado).filter(g => g && g.trim() !== ''))];
    return grados.sort();
  };

  const getUniqueGrupos = () => {
    const activePersons = persons.filter(p => !('deletedAt' in p && p.deletedAt));
    const grupos = [...new Set(activePersons.map(p => p.grupo).filter(g => g && g.trim() !== ''))];
    return grupos.sort();
  };

  // Función para filtrar y paginar personas
  const getFilteredAndPaginatedPersons = () => {
    const activePersons = persons.filter(p => !('deletedAt' in p && p.deletedAt));

    const filtered = activePersons.filter(person => {
      const matchesSearch = !searchTerm ||
        `${person.nombre1} ${person.apellido1} ${person.doc} ${person.email || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || person.tipoPersona === filterType;
      const matchesGrado = filterGrado === 'all' || person.grado === filterGrado;
      const matchesGrupo = filterGrupo === 'all' || person.grupo === filterGrupo;

      return matchesSearch && matchesType && matchesGrado && matchesGrupo;
    });

    // Calcular paginación
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPersons = filtered.slice(startIndex, endIndex);

    return {
      currentPersons,
      totalPages,
      totalFiltered: filtered.length
    };
  };

  const { currentPersons, totalPages, totalFiltered } = getFilteredAndPaginatedPersons();

  return (
    <>
      <div className="max-w-7xl mx-auto py-8 px-4">
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBulkOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2 text-sm"
              >
                <span>📤</span>
                <span>Cargar masivo</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <span>+</span>
                <span>Registrar Persona</span>
              </button>
            </div>
          </div>

          {/* Filtros de búsqueda */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Campo de búsqueda */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="Estudiante">Estudiantes</option>
                  <option value="Profesor">Profesores</option>
                  <option value="Colaborador">Colaboradores</option>
                  <option value="Publico">Público</option>
                </select>
              </div>

              {/* Filtro por grado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grado
                </label>
                <select
                  value={filterGrado}
                  onChange={(e) => setFilterGrado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los grados</option>
                  {getUniqueGrados().map(grado => (
                    <option key={grado} value={grado}>{grado}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por grupo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo
                </label>
                <select
                  value={filterGrupo}
                  onChange={(e) => setFilterGrupo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los grupos</option>
                  {getUniqueGrupos().map(grupo => (
                    <option key={grupo} value={grupo}>{grupo}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Personas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600">
                {stats.estudiantes}
              </div>
              <div className="text-sm text-gray-600">Estudiantes</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">
                {stats.profesores}
              </div>
              <div className="text-sm text-gray-600">Profesores</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-orange-600">
                {stats.colaboradores}
              </div>
              <div className="text-sm text-gray-600">Colaboradores</div>
            </div>
          </div>

          {/* Controles de paginación y resultados - Superior */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {currentPersons.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} - {Math.min(currentPage * itemsPerPage, totalFiltered)} de {totalFiltered} resultados
                {(searchTerm || filterType !== 'all' || filterGrado !== 'all' || filterGrupo !== 'all') && 
                  ` (filtrados de ${stats.total} total)`
                }
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ← Anterior
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex space-x-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm border rounded ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de personas */}
          <PersonsTable
            persons={currentPersons}
            loading={loading}
            searchTerm=""
            filterType={filterType}
            onPersonUpdated={loadPersons}
          />

          {/* Modales */}
          <CreatePersonModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreatePerson}
          />
          
          <BulkUploadModal
            isOpen={isBulkOpen}
            onClose={() => setIsBulkOpen(false)}
          />
        </div>
      </div>
    </>
  );
};

export default PersonManagementPage;