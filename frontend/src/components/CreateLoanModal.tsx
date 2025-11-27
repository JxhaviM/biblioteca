import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  coverImage?: string;
  availability?: {
    availableCopies: number;
    totalCopies: number;
  };
}

interface Person {
  _id: string;
  name: string;
  idNumber: string;
  grado?: string;
  userId?: string;
  hasUser?: boolean;
  celular?: string;
  email?: string;
  direccion?: string;
  apellido1?: string;
  apellido2?: string;
  nombre1?: string;
  nombre2?: string;
  genero?: string;
  tipoPersona?: string;
}

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLoanModal: React.FC<CreateLoanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [bookSearch, setBookSearch] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const [personSearch, setPersonSearch] = useState('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (bookSearch.length >= 2) {
      searchBooks();
    } else {
      setBooks([]);
    }
  }, [bookSearch]);

  useEffect(() => {
    if (personSearch.length >= 2) {
      searchPersons();
    } else {
      setPersons([]);
    }
  }, [personSearch]);

  useEffect(() => {
    if (!dueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate.toISOString().split('T')[0]);
    }
  }, []);

  const searchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/books?search=' + bookSearch + '&isActive=true&limit=10'), {
        headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}) }
      });
      const data = await response.json();
      if (data.success) {
        const availableBooks = (data.data || []).filter((book: Book) => 
          book.availability && book.availability.availableCopies > 0
        );
        setBooks(availableBooks);
      }
    } catch (error) {
      console.error('Error buscando libros:', error);
    }
  };

  const searchPersons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/persons/with-account?search=' + personSearch + '&limit=10'), {
        headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}) }
      });
      const data = await response.json();
      if (data.success) {
        setPersons(data.data || []);
      }
    } catch (error) {
      console.error('Error buscando personas:', error);
    }
  };

  const handleCreateLoan = async () => {
    if (!selectedBook || !selectedPerson) {
      alert('Debes seleccionar un libro y una persona');
      return;
    }

    if (!selectedPerson.userId) {
      alert('Esta persona no tiene un usuario asociado');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildApiUrl('/loans'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({
          bookId: selectedBook._id,
          userId: selectedPerson.userId,
          copyNumber: 1,
          dueDate: new Date(dueDate).toISOString(),
          loanedBy: 'Administrador',
          notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Prestamo creado exitosamente');
        onSuccess();
        handleClose();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error creando prestamo:', error);
      alert('Error al crear el prestamo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBookSearch('');
    setBooks([]);
    setSelectedBook(null);
    setPersonSearch('');
    setPersons([]);
    setSelectedPerson(null);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-bold">Nuevo Prestamo</h3>
          <button onClick={handleClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">1. Selecciona el Libro</h4>
              <input
                type="text"
                placeholder="Buscar por titulo, autor o ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              {books.length > 0 && (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {books.map((book) => (
                    <div
                      key={book._id}
                      onClick={() => {
                        setSelectedBook(book);
                        setStep(2);
                      }}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    >
                      <p className="font-semibold">{book.title}</p>
                      <p className="text-sm text-gray-600">{book.author}</p>
                      <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
                      <p className="text-xs text-green-600">
                        {book.availability?.availableCopies} disponibles
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {bookSearch.length >= 2 && books.length === 0 && (
                <p className="text-center text-gray-500 py-4">No se encontraron libros</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-800">
                Cambiar libro
              </button>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Libro seleccionado:</p>
                <p className="font-semibold">{selectedBook?.title}</p>
              </div>

              <h4 className="text-lg font-semibold">2. Selecciona la Persona</h4>
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              {persons.length > 0 && (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {persons.map((person) => (
                    <div
                      key={person._id}
                      onClick={() => {
                        if (person.userId) {
                          setSelectedPerson(person);
                          setStep(3);
                        } else {
                          alert('Esta persona no tiene usuario. Debe crear uno primero.');
                        }
                      }}
                      className="p-4 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer"
                    >
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-sm text-gray-600">ID: {person.idNumber}</p>
                      {!person.userId && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Sin usuario</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {personSearch.length >= 2 && persons.length === 0 && (
                <p className="text-center text-gray-500 py-4">No se encontraron personas</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-blue-600 hover:text-blue-800">
                Cambiar persona
              </button>

              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Libro:</p>
                  <p className="font-semibold">{selectedBook?.title}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Persona:</p>
                  <p className="font-semibold">{selectedPerson?.name}</p>
                </div>
              </div>

              <h4 className="text-lg font-semibold">3. Confirmar Detalles</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Devolucion
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observaciones..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateLoan}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Prestamo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLoanModal;
