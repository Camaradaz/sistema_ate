import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, Baby, UserCheck, Gift, History, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowModal(false);
  };

  return (
    <nav className="bg-emerald-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">ATE Avellaneda</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8 items-center">
              <Link to="/" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Home className="h-5 w-5 mr-1" />
                Inicio
              </Link>
              <Link to="/afiliados" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Users className="h-5 w-5 mr-1" />
                Afiliados
              </Link>
              <Link to="/hijos" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Baby className="h-5 w-5 mr-1" />
                Hijos
              </Link>
              <Link to="/delegados" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <UserCheck className="h-5 w-5 mr-1" />
                Delegados
              </Link>
              <Link to="/sectores" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Building2 className="h-5 w-5 mr-1" />
                Sectores
              </Link>
              <Link to="/beneficios" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Gift className="h-5 w-5 mr-1" />
                Beneficios
              </Link>
              <Link to="/historial" className="text-white hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <History className="h-5 w-5 mr-1" />
                Historial
              </Link>
              <div className="relative flex items-center">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-white px-3 py-2 text-sm font-medium flex items-center hover:bg-emerald-700 rounded-md h-full"
                >
                  ¡Bienvenid@, <span className="font-bold ml-1">{user?.username}</span>!
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 top-full">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar cierre de sesión</h3>
            <p className="text-gray-500 mb-6">¿Estás seguro que deseas cerrar sesión?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar; 