// frontend/src/App.tsx

import './App.css'; // Esto ya lo moveremos más tarde

function App() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-5xl font-extrabold text-blue-700 mb-4">
        ¡Bienvenido a Mi Biblioteca MERN!
      </h1>
      <p className="text-lg text-gray-800">
        El frontend de React y Tailwind están funcionando correctamente.
      </p>
    </div>
  );
}

export default App;