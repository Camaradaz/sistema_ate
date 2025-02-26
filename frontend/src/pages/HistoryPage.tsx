import React, { useState, useEffect } from 'react';
import { Search, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '../context/HistoryContext';

function HistoryPage() {
  const navigate = useNavigate();
  const { events } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    console.log('Eventos actuales:', events);
  }, [events]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'create':
        return 'Creación';
      case 'update':
        return 'Actualización';
      case 'delete':
        return 'Eliminación';
      default:
        return type;
    }
  };

  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (event: any) => {
    navigate(event.path);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === '' || event.event_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Historial</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">Filtrar por fecha</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar en el historial..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Todos los eventos</option>
              <option value="create">Creaciones</option>
              <option value="update">Actualizaciones</option>
              <option value="delete">Eliminaciones</option>
            </select>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventTypeClass(event.event_type)}`}>
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{event.user}</td>
                      <td className="px-6 py-4">{event.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewDetails(event)}
                          className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                        >
                          Ver detalles
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron eventos que coincidan con los filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;