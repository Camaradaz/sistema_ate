import React, { useState, useEffect } from 'react';
import { Search, Gift, Pencil, Trash2, AlertTriangle, Eye, X } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { useStorage } from '../context/StorageContext';
import { toast } from 'react-hot-toast';

interface Benefit {
  id: number;
  name: string;
  type: string;
  age_range: string;
  stock: number;
  stock_rest: number;
  status: string;
  is_available: boolean;
}



interface DelegateAssignment {
  id: number;
  delegateId: number;
  delegateName: string;
  quantity: number;
  assignmentDate: string;
}

function BenefitsPage() {
  const { addEvent } = useHistory();
  const { 
    benefits, 
    setBenefits, 
    benefitDeliveries,
    delegates
  } = useStorage();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");

  const fetchBenefits = async () => {
    try {
      const response = await fetch('http://localhost:5000/beneficios', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Beneficios cargados:', data);
      setBenefits(data);
    } catch (error) {
      console.error('Error al cargar beneficios:', error);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  const handleSubmitBenefit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const benefitData = {
      name: formData.get('name'),
      type: formData.get('type'),
      age_range: formData.get('age_range'),
      stock: parseInt(formData.get('stock') as string) || 0,
      status: formData.get('status') || 'Disponible',
      is_available: formData.get('status') === 'Disponible'
    };

    try {
      // Determinar si es edición o creación
      const url = selectedBenefit 
        ? `http://localhost:5000/benefits/${selectedBenefit.id}`
        : 'http://localhost:5000/benefits';

      const method = selectedBenefit ? 'PUT' : 'POST';
      
      console.log(`${method} beneficio:`, benefitData); // Debug

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(benefitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el beneficio');
      }

      const savedBenefit = await response.json();
      console.log('Beneficio guardado:', savedBenefit); // Debug

      // Actualizar el estado local
      if (selectedBenefit) {
        setBenefits(prevBenefits => 
          prevBenefits.map(b => b.id === selectedBenefit.id ? savedBenefit : b)
        );
        toast.success('Beneficio actualizado con éxito');
      } else {
        setBenefits(prevBenefits => [...prevBenefits, savedBenefit]);
        toast.success('Beneficio creado con éxito');
      }
      
      // Cerrar el modal y limpiar el estado
      setShowModal(false);
      setSelectedBenefit(null);
      form.reset();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el beneficio');
    }
  };

  const handleEdit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowModal(true);
  };

  const handleDeleteClick = (benefit: Benefit) => {
    setBenefitToDelete(benefit);
    setShowDeleteModal(true);
  };

  const handleViewHistory = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowHistoryModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!benefitToDelete) return;

    try {
      console.log('Intentando eliminar beneficio:', benefitToDelete.id);
      
      const response = await fetch(`http://localhost:5000/beneficios/${benefitToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',  // Aseguramos que se maneje CORS correctamente
      });

      console.log('Response status:', response.status); // Debug

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: No se pudo eliminar el beneficio`);
      }

      // Actualizar el estado local
      setBenefits(prevBenefits => prevBenefits.filter(b => b.id !== benefitToDelete.id));
      
      // Registrar el evento
      addEvent({
        eventType: 'delete',
        category: 'benefit',
        description: `Se eliminó el beneficio: ${benefitToDelete.name}`,
        entityId: benefitToDelete.id,
        path: '/beneficios'
      });

      // Cerrar el modal y limpiar el estado
      setShowDeleteModal(false);
      setBenefitToDelete(null);
      
      // Mostrar mensaje de éxito
      toast.success('Beneficio eliminado con éxito');

    } catch (error) {
      console.error('Error al eliminar beneficio:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el beneficio');
    }
  };

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

  const getBenefitDeliveries = (benefitId: number) => {
    return benefitDeliveries.filter(delivery => delivery.benefitId === benefitId);
  };

  const getDelegateName = (delegateId: number) => {
    const delegate = delegates.find(d => d.id === delegateId);
    return delegate?.name || 'Delegado no encontrado';
  };

  const handleStockAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBenefit) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const delegateId = parseInt(formData.get('delegateId') as string);
    const quantity = parseInt(formData.get('quantity') as string);

    try {
      if (quantity > selectedBenefit.stock) {
        throw new Error('No hay suficiente stock disponible');
      }

      // Usar la nueva ruta de asignación
      const response = await fetch('http://localhost:5000/beneficios/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benefitId: selectedBenefit.id,
          delegateId,
          quantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar stock');
      }

      const { assignment, benefit: updatedBenefit } = await response.json();

      // Actualizar estados locales
      setBenefits(benefits.map(b => 
        b.id === selectedBenefit.id ? updatedBenefit : b
      ));
      setSelectedBenefit(updatedBenefit);

      // Actualizar el delegado
      const selectedDelegate = delegates.find(d => d.id === delegateId);
      if (!selectedDelegate) {
        throw new Error('Delegado no encontrado');
      }

      const updatedDelegate = {
        ...selectedDelegate,
        inventory: [...(selectedDelegate.inventory || [])]
      };

      const existingItemIndex = updatedDelegate.inventory.findIndex(
        item => item.benefitId === selectedBenefit.id
      );

      if (existingItemIndex >= 0) {
        updatedDelegate.inventory[existingItemIndex] = {
          ...updatedDelegate.inventory[existingItemIndex],
          stockAssigned: updatedDelegate.inventory[existingItemIndex].stockAssigned + quantity,
          stockRemaining: updatedDelegate.inventory[existingItemIndex].stockRemaining + quantity,
          dateAssigned: new Date().toISOString()
        };
      } else {
        updatedDelegate.inventory.push({
          benefitId: selectedBenefit.id,
          benefitName: selectedBenefit.name,
          stockAssigned: quantity,
          stockRemaining: quantity,
          dateAssigned: new Date().toISOString()
        });
      }

      // Actualizar estados
      setDelegates(delegates.map(d => 
        d.id === delegateId ? updatedDelegate : d
      ));

      form.reset();
      alert('Stock asignado exitosamente');

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al asignar stock');
    }
  };

  const handleDeleteDelegateAssignment = async (assignment: DelegateAssignment) => {
    if (!selectedBenefit) return;

    try {
      if (!window.confirm('¿Está seguro que desea eliminar esta asignación? Esta acción devolverá el stock al beneficio.')) {
        return;
      }

      // Actualizar el stock en la base de datos
      const response = await fetch(`http://localhost:5000/beneficios/${selectedBenefit.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: selectedBenefit.stock + assignment.quantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el stock');
      }

      const updatedBenefit = await response.json();

      // Actualizar el delegado
      const updatedDelegates = delegates.map(delegate => {
        if (delegate.id === assignment.delegateId) {
          return {
            ...delegate,
            inventory: delegate.inventory.filter(item => 
              !(item.benefitId === selectedBenefit.id && 
                item.dateAssigned === assignment.assignmentDate)
            )
          };
        }
        return delegate;
      });

      // Actualizar estados
      setBenefits(benefits.map(b => 
        b.id === selectedBenefit.id ? updatedBenefit : b
      ));
      setDelegates(updatedDelegates);

      // Registrar el evento
      addEvent({
        eventType: 'delete',
        category: 'benefit_assignment',
        description: `Eliminación de asignación de ${assignment.quantity} unidades de ${selectedBenefit.name} al delegado ${assignment.delegateName}`,
        entityId: selectedBenefit.id,
        path: '/beneficios'
      });

      alert('Asignación eliminada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la asignación');
    }
  };

  const handleDeleteBenefit = async (benefitId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/benefits/${benefitId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el beneficio');
      }

      // Actualizar la lista local
      setBenefits(prevBenefits => 
        prevBenefits.filter(benefit => benefit.id !== benefitId)
      );
      
      toast.success('Beneficio eliminado con éxito');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el beneficio');
    }
  };

  // Modificar la función de filtrado para incluir tanto la búsqueda por nombre como por tipo
  const filteredBenefits = benefits.filter((benefit) =>
    benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedType === "" || benefit.type === selectedType)
  );

  // Función para manejar el filtro por tipo
  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Beneficios</h1>
        <button 
          onClick={() => {
            setSelectedBenefit(null);
            setShowModal(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Gift className="w-5 h-5" />
          Nuevo Beneficio
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="text"
              placeholder="Buscar beneficios..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select 
            className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedType}
            onChange={(e) => handleTypeFilter(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="Kit Escolar">Kit Escolar</option>
            <option value="Regalo Navideño">Regalo Navideño</option>
            <option value="Beneficio Especial">Beneficio Especial</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beneficio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rango de Edad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Restante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBenefits.map((benefit) => (
                <tr key={benefit.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{benefit.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {benefit.type === 'false' || benefit.type === 'true' ? 'Kit Escolar' : benefit.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {benefit.age_range ? benefit.age_range : 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      benefit.stock > 20 
                        ? 'bg-green-100 text-green-800'
                        : benefit.stock > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {benefit.stock} unidades
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      benefit.stock_rest > 20 
                        ? 'bg-green-100 text-green-800'
                        : benefit.stock_rest > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {benefit.stock_rest} unidades
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      benefit.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {benefit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewHistory(benefit)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver historial"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(benefit)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBenefit(benefit.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar beneficio"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">1</span> a <span className="font-medium">10</span> de{' '}
            <span className="font-medium">20</span> resultados
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-md hover:bg-gray-50">Anterior</button>
            <button className="px-3 py-1 border rounded-md hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBenefit ? 'Editar Beneficio' : 'Nuevo Beneficio'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBenefit(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitBenefit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedBenefit?.name || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <input
                  type="text"
                  name="type"
                  defaultValue={selectedBenefit?.type || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rango de Edad</label>
                <input
                  type="text"
                  name="age_range"
                  defaultValue={selectedBenefit?.age_range || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  name="stock"
                  defaultValue={selectedBenefit?.stock || 0}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  name="status"
                  defaultValue={selectedBenefit?.status || 'Disponible'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                >
                  <option value="Disponible">Disponible</option>
                  <option value="No Disponible">No Disponible</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBenefit(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                >
                  {selectedBenefit ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && benefitToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
            </div>
            <p className="mb-6 text-gray-600">
              ¿Está seguro que desea eliminar el beneficio "{benefitToDelete.name}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBenefitToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedBenefit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Historial de {selectedBenefit.name}</h2>
                <p className="text-gray-600">
                  Stock actual: {selectedBenefit.stock} unidades
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedBenefit(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sección de Asignaciones a Delegados */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Asignaciones a Delegados</h3>
                <div className="space-y-3">
                  {delegates
                    .filter(delegate => 
                      delegate.inventory?.some(item => item.benefitId === selectedBenefit.id)
                    )
                    .map(delegate => {
                      const assignments = delegate.inventory
                        .filter(item => item.benefitId === selectedBenefit.id)
                        .map(item => ({
                          id: Math.random(), // Temporal, idealmente usar un ID real
                          delegateId: delegate.id,
                          delegateName: `${delegate.first_name} ${delegate.last_name}`,
                          quantity: item.stockAssigned,
                          assignmentDate: item.dateAssigned
                        }));

                      return assignments.map(assignment => (
                        <div key={assignment.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {assignment.delegateName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Cantidad asignada: {assignment.quantity} unidades
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">
                                {formatDate(assignment.assignmentDate)}
                              </span>
                              <button
                                onClick={() => handleDeleteDelegateAssignment(assignment)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Eliminar asignación"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    })}
                  {!delegates.some(delegate => 
                    delegate.inventory?.some(item => item.benefitId === selectedBenefit.id)
                  ) && (
                    <p className="text-gray-500 text-center py-4">
                      No hay asignaciones a delegados para este beneficio
                    </p>
                  )}
                </div>
              </div>

              {/* Sección de Entregas a Afiliados */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Entregas a Afiliados</h3>
                <div className="space-y-3">
                  {getBenefitDeliveries(selectedBenefit.id).map((delivery) => (
                    <div key={delivery.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Entregado a: {delivery.recipientType === 'affiliate' 
                              ? delivery.affiliateName 
                              : `${delivery.childName} (Hijo/a de ${delivery.affiliateName})`
                            }
                          </h4>
                          <p className="text-sm text-gray-500">
                            Entregado por: {getDelegateName(delivery.delegateId)}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(delivery.deliveryDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getBenefitDeliveries(selectedBenefit.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No hay entregas registradas para este beneficio
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BenefitsPage;