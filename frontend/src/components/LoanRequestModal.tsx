import React from 'react';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (loanData: any) => void;
  book: any;
}

const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  book
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Solicitar Prestamo</h2>
        <p className="text-gray-600 mb-4">Libro: {book?.title}</p>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Solicitar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanRequestModal;
