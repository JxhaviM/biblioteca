import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginModal from './LoginModal';
import type { User, Person } from '../api/auth';

interface HomePageWrapperProps {
  onLoginClick?: () => void;
}

const HomePageWrapper: React.FC<HomePageWrapperProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedPerson = localStorage.getItem('person');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPerson) setPerson(JSON.parse(savedPerson));
  }, []);

  // Esta función se pasa al MainLayout para el botón del header
  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData.user);
    setPerson(userData.person);
    setShowLoginModal(false);
    
    // Redirigir según el rol
    if (userData.user.role === 'user') {
      navigate('/dashboard/user', { replace: true });
    } else if (userData.user.role === 'admin') {
      navigate('/dashboard/admin', { replace: true });
    } else if (userData.user.role === 'superadmin') {
      navigate('/dashboard/superadmin', { replace: true });
    }
  };

  return (
    <>
      <HomePage 
        user={user}
        person={person}
        setUser={setUser}
        setPerson={setPerson}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default HomePageWrapper;
