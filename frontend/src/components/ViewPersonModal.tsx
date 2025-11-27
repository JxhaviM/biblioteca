import React from 'react';
import type { Person } from '../types';

interface ViewPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

const ViewPersonModal: React.FC<ViewPersonModalProps> = ({ isOpen, onClose, person }) => {
  if (!isOpen || !person) return null;

  const formatDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Datos de la persona</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-600">Nombre completo</div>
            <div className="text-gray-900">{person.nombre1} {person.nombre2 || ''} {person.apellido1} {person.apellido2 || ''}</div>
          </div>

          <div>
            <div className="text-xs text-gray-600">Documento</div>
            <div className="text-gray-900">{person.doc || 'N/A'} • {person.tipoDoc || 'CC'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-600">Género</div>
            <div className="text-gray-900">{person.genero || '-'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-600">Fecha Nacimiento</div>
            <div className="text-gray-900">{formatDate(person.fechaNacimiento)}</div>
          </div>

          <div>
            <div className="text-xs text-gray-600">Celular</div>
            <div className="text-gray-900">{person.celular || '-'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-600">Email</div>
            <div className="text-gray-900">{person.email || '-'}</div>
          </div>

          <div className="col-span-full">
            <div className="text-xs text-gray-600">Dirección</div>
            <div className="text-gray-900">{person.direccion || '-'}</div>
          </div>

          <div className="col-span-full">
            <div className="text-xs text-gray-600">Tipo de persona</div>
            <div className="text-gray-900">{person.tipoPersona}</div>
          </div>

          {person.tipoPersona === 'Estudiante' && (
            <>
              <div>
                <div className="text-xs text-gray-600">Grado</div>
                <div className="text-gray-900">{person.grado || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Grupo</div>
                <div className="text-gray-900">{person.grupo || '-'}</div>
              </div>
            </>
          )}

          {person.tipoPersona === 'Profesor' && (
            <>
              <div>
                <div className="text-xs text-gray-600">Nivel Educativo</div>
                <div className="text-gray-900">{person.nivelEducativo || '-'}</div>
              </div>
              <div className="col-span-full">
                <div className="text-xs text-gray-600">Materias</div>
                <div className="text-gray-900">{(person.materias || []).length ? (person.materias || []).join(', ') : '-'}</div>
              </div>
            </>
          )}

          {person.tipoPersona === 'Colaborador' && (
            <div className="col-span-full">
              <div className="text-xs text-gray-600">Observaciones</div>
              <div className="text-gray-900">{person.observaciones || '-'}</div>
            </div>
          )}

        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ViewPersonModal;
