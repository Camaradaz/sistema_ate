import React from 'react';
import { Users, Baby, UserCheck, Gift, History, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function HomePage() {
  const { user, isAuthenticated } = useAuth();

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const features = [
    {
      title: 'Afiliados',
      description: 'Gestione la base de datos de afiliados y su carga social',
      icon: <Users className="w-10 h-10" />,
      path: '/afiliados',
    },
    {
      title: 'Hijos',
      description: 'Mantenga un registro actualizado de los hijos de afiliados',
      icon: <Baby className="w-10 h-10" />,
      path: '/hijos',
    },
    {
      title: 'Delegados',
      description: 'Administre los delegados capacitados para la distribución',
      icon: <UserCheck className="w-10 h-10" />,
      path: '/delegados',
    },
    {
      title: 'Sectores',
      description: 'Gestione y supervise los sectores con el registro de afiliados que mantienen su cuota social activa',
      icon: <Building2 className="w-10 h-10" />,
      path: '/sectores',
    },
    {
      title: 'Beneficios',
      description: 'Gestione la entrega de kits escolares y otros beneficios',
      icon: <Gift className="w-10 h-10" />,
      path: '/beneficios',
    },
    {
      title: 'Historial',
      description: 'Acceda al registro histórico de entregas y actualizaciones',
      icon: <History className="w-10 h-10" />,
      path: '/historial',
    },
  ];

  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema de Gestión ATE Avellaneda
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Bienvenido {user?.username}. Seleccione una de las siguientes opciones para comenzar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {features.map((feature, index) => (
          <Link
            key={feature.path}
            to={feature.path}
            className={`block group ${
              index === features.length - 1 && features.length % 2 !== 0
                ? 'md:col-span-2 lg:col-span-1'
                : ''
            }`}
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-8 h-full flex flex-col items-center text-center">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;