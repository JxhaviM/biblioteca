import React, { useState, useEffect } from 'react';
import { useUserContext } from '../contexts/UserContext';
import loansApi from '../api/loans';
import type { Loan } from '../api/loans';
import LoansSection from '../components/LoansSection';

const UserLoansPage: React.FC = () => {
  const { user } = useUserContext();
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar préstamos del usuario
  const loadUserLoans = async () => {
    try {
      const response = await loansApi.getMyLoans();
      if (response && response.success) {
        setUserLoans(response.loans || []);
      }
    } catch (error) {
      console.error('Error al cargar préstamos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserLoans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📖</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Cargando Préstamos</h2>
            <p className="text-gray-600">Preparando tus préstamos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header elegante */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur p-4 rounded-2xl">
              <span className="text-3xl">📖</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Mis Préstamos 📚
              </h1>
              <p className="text-blue-100 font-medium">Gestiona tus préstamos activos e historial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de préstamos */}
      <div className="bg-white rounded-lg shadow">
        <LoansSection 
          user={user} 
          userLoans={userLoans} 
          onRefresh={loadUserLoans} 
        />
      </div>
    </div>
  );
};

export default UserLoansPage;
