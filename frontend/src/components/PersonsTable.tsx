import React, { useState } from 'react';
import EditPersonModal from './EditPersonModal';
import ViewPersonModal from './ViewPersonModal';
import ChangePersonStatusModal from './ChangePersonStatusModal';
import type { Person } from '../types';

interface PersonsTableProps {
  persons: Person[];
  loading: boolean;
  searchTerm: string;
  filterType: string;
  onPersonUpdated?: () => void;
}

const PersonsTable: React.FC<PersonsTableProps> = ({
  persons,
  loading,
  searchTerm,
  filterType,
  onPersonUpdated
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [personToChangeStatus, setPersonToChangeStatus] = useState<Person | null>(null);
  const [localPersons, setLocalPersons] = useState<Person[]>(persons);
  
  // Filtrar personas (movemos la lógica aquí)
  const filteredPersons = (localPersons.length ? localPersons : persons).filter(person => {
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed" style={{ minWidth: '1000px' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-[22%]">
                Persona
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-[13%]">
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-[17%]">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-[23%]">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-[15%]">
                Información Específica
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-[10%]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPersons.map((person) => (
              <tr key={person._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 align-top text-left">
                  <div className="space-y-2">
                    <div className="flex flex-wrap">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {person.nombre1 || ''} {person.nombre2 && person.nombre2} {person.apellido1 || ''} {person.apellido2 && person.apellido2}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {person.genero && `${person.genero}`}
                      {person.fechaNacimiento && ` • ${new Date(person.fechaNacimiento).toLocaleDateString()}`}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-left">
                  <div className="space-y-2">
                    <div className="flex flex-wrap">
                      <div className="text-sm text-gray-900 truncate">{person.doc || 'N/A'}</div>
                    </div>
                    <div className="text-sm text-gray-500">{person.tipoDoc || 'CC'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-left">
                  <div className="space-y-2">
                    {/* Tipo de Persona */}
                    <div className="flex flex-wrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        person.tipoPersona === 'Estudiante' ? 'bg-green-100 text-green-800' :
                        person.tipoPersona === 'Profesor' ? 'bg-purple-100 text-purple-800' :
                        person.tipoPersona === 'Colaborador' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {person.tipoPersona}
                      </span>
                    </div>
                    
                    {/* Estado del Usuario */}
                    <div className="text-xs space-y-1.5">
                      {/* Estado de la Persona */}
                      <div className="flex items-center space-x-1.5">
                        <span>🔰</span>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                          person.estado === 'Activo' ? 'bg-green-100 text-green-800' :
                          person.estado === 'Suspendido' ? 'bg-yellow-100 text-yellow-800' :
                          person.estado === 'Vetado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {person.estado}
                        </span>
                        {person.motivoEstado && (
                          <span className="text-gray-500" title={person.motivoEstado}>
                            ℹ️
                          </span>
                        )}
                      </div>

                      {/* Estado del Usuario */}
                      {person.hasUser && person.userInfo ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-gray-600">
                            <span>👤</span>
                            <span>Usuario creado</span>
                          </div>
                          <div className="flex flex-wrap">
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                              person.userInfo.rol === 'MasterSuperAdmin' ? 'bg-red-100 text-red-800' :
                              person.userInfo.rol === 'SuperAdmin' ? 'bg-yellow-100 text-yellow-800' :
                              person.userInfo.rol === 'Admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {person.userInfo.rol}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-gray-400">
                          <span>👤</span>
                          <span>Sin usuario</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-left">
                  <div className="space-y-2">
                    {person.celular && (
                      <div className="flex items-center space-x-2">
                        <span>📱</span>
                        <span>{person.celular}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center space-x-2">
                        <span>📧</span>
                        <span className="truncate max-w-[200px]" title={person.email}>
                          {person.email}
                        </span>
                      </div>
                    )}
                    {person.direccion && (
                      <div className="flex items-center space-x-2">
                        <span>🏠</span>
                        <span className="truncate max-w-[180px]" title={person.direccion}>
                          {person.direccion}
                        </span>
                      </div>
                    )}
                    {!person.celular && !person.email && !person.direccion && (
                      <span className="text-gray-400 text-xs">Sin información de contacto</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-left">
                  <div className="space-y-2">
                    {person.tipoPersona === 'Estudiante' && (
                      <div className="space-y-1">
                        {person.grado && (
                          <div className="flex items-center space-x-1">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Grado {person.grado}
                            </span>
                          </div>
                        )}
                        {person.grupo && (
                          <div className="flex items-center space-x-1">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Grupo {person.grupo}
                            </span>
                          </div>
                        )}
                        {!person.grado && !person.grupo && (
                          <span className="text-gray-500 text-xs">Sin información específica</span>
                        )}
                      </div>
                    )}
                    
                    {person.tipoPersona === 'Profesor' && (
                      <div className="space-y-2">
                        {person.nivelEducativo && (
                          <div>
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              {person.nivelEducativo}
                            </span>
                          </div>
                        )}
                        {person.materias && person.materias.length > 0 ? (
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Materias:</div>
                            <div className="flex flex-wrap gap-1">
                              {person.materias.map((materia, index) => (
                                <span
                                  key={index}
                                  className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded"
                                >
                                  {materia}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Sin materias asignadas</span>
                        )}
                      </div>
                    )}
                    
                    {person.tipoPersona === 'Colaborador' && (
                      <div className="space-y-1">
                        {person.observaciones ? (
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Función:</span> {person.observaciones}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Colaborador general</span>
                        )}
                      </div>
                    )}
                    
                    {person.tipoPersona === 'Publico' && (
                      <div className="space-y-1">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          Usuario externo
                        </span>
                        {person.observaciones && (
                          <div className="text-xs text-gray-600">{person.observaciones}</div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-top text-sm font-medium text-left">
                  <div className="flex flex-col space-y-1">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setIsEditOpen(true);
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50"
                        title="Editar persona"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setIsViewOpen(true);
                        }}
                        className="text-green-500 hover:text-green-700 text-sm px-2 py-1 rounded hover:bg-green-50"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setPersonToChangeStatus(person);
                        setIsChangeStatusOpen(true);
                      }}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        person.estado === 'Activo' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                        person.estado === 'Suspendido' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                        'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      title={`Estado actual: ${person.estado}. Click para cambiar`}
                    >
                      🔄 Estado
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <EditPersonModal
          isOpen={isEditOpen}
          person={selectedPerson}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updated: Person) => {
            setLocalPersons(prev => prev.map(p => p._id === updated._id ? updated : p));
            setIsEditOpen(false);
            setSelectedPerson(null);
          }}
        />
        <ViewPersonModal
          isOpen={isViewOpen}
          person={selectedPerson}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedPerson(null);
          }}
        />

        {/* Modal de Cambio de Estado */}
        <ChangePersonStatusModal
          isOpen={isChangeStatusOpen}
          person={personToChangeStatus}
          onClose={() => {
            setIsChangeStatusOpen(false);
            setPersonToChangeStatus(null);
          }}
          onSuccess={() => {
            // Recargar la lista de personas
            if (onPersonUpdated) {
              onPersonUpdated();
            }
          }}
        />
        
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
  );
};

export default PersonsTable;
