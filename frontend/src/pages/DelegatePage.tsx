import React, { useState, useEffect, FormEvent } from 'react';
import { Search, UserPlus, Pencil, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { useStorage } from '../context/StorageContext';
import { toast } from 'react-hot-toast';

interface Delegate {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  sector_id: number;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  inventory: any[];
}

interface Sector {
  id: number;
  name: string;
  code: string;
}

function DelegatePage() {
  const { addEvent } = useHistory();
  const { 
    delegates, 
    setDelegates,
    benefits,
    setBenefits,
    benefitDeliveries,
    setBenefitDeliveries,
    children,
    setChildren,
   sectors,
    setSectors
  } = useStorage();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
 const [selectedDelegate, setSelectedDelegate] = useState<Delegate | null>(null);
  const [delegateToDelete, setDelegateToDelete] = useState<Delegate | null>(null);
console.log(sectors)
  // Asegurarnos de que tenemos los datos antes de renderizar
  const safeDelegates = delegates || [];
  const safeSectors = sectors || [];

  const [selectedSector, setSelectedSector] = useState<string>("");

  const getSectorName = (sectorId: number) => {
    const sector = sectors.find(s => s.sector_id === sectorId);
    return sector ? sector.sector_name : 'No asignado';
  };

  const handleEdit = (delegate: Delegate) => {
    setSelectedDelegate(delegate);
    setShowModal(true);
  };

  const handleDeleteClick = (delegate: Delegate) => {
    setDelegateToDelete(delegate);
    setShowDeleteModal(true);
  };

  const handleViewClick = (delegate: Delegate) => {
    console.log("Delegate clicked:", delegate);
    setSelectedDelegate(delegate);
    setShowHistoryModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!delegateToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/delegados/${delegateToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el delegado');
      }

      setDelegates(delegates.filter(d => d.id !== delegateToDelete.id));
      setShowDeleteModal(false);
      setDelegateToDelete(null);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el delegado');
    }
  };

  const handleSubmitDelegate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const delegateData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      dni: formData.get('dni'),
      sector_id: parseInt(formData.get('sector_id') as string),
      is_active: formData.get('is_active') === 'on'
    };

    try {
      console.log('Enviando datos:', delegateData); // Debug

      const response = await fetch('http://localhost:5000/delegados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(delegateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el delegado');
      }

      const savedDelegate = await response.json();
      console.log('Delegado guardado:', savedDelegate); // Debug

      // Actualizar el estado local
      setDelegates([...delegates, savedDelegate]);
      
      // Cerrar el modal y mostrar mensaje de éxito
      setShowModal(false);
      toast.success('Delegado creado con éxito');
      
      // Limpiar el formulario
      form.reset();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el delegado');
    }
  };

  // Modificar el useEffect para que sea más simple
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            await Promise.all([fetchDelegates(), fetchSectors()]);
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            alert('Error al cargar los datos. Por favor, recargue la página.');
        }
    };

    loadInitialData();
  }, []);

  const handleStockAssignment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDelegate) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const benefitId = parseInt(formData.get('benefitId') as string);
    const quantity = parseInt(formData.get('quantity') as string);

    try {
      // Validar datos
      if (!benefitId || !quantity) {
        throw new Error('Beneficio y cantidad son requeridos');
      }

      const selectedBenefit = benefits.find(b => b.id === benefitId);
      if (!selectedBenefit) {
        throw new Error('Beneficio no encontrado');
      }

      if (quantity > selectedBenefit.stock) {
        throw new Error('No hay suficiente stock disponible');
      }

      // Crear la asignación en la base de datos
      const response = await fetch('http://localhost:5000/delegate-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegate_id: selectedDelegate.id,
          benefit_id: benefitId,
          quantity: quantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar stock');
      }

      const { assignment, benefit } = await response.json();

      // Actualizar el estado local de los beneficios con los valores correctos
      setBenefits(benefits.map(b => 
        b.id === benefitId ? benefit : b
      ));

      // Actualizar el inventario del delegado
      const updatedDelegate = {
        ...selectedDelegate,
        inventory: [...(selectedDelegate.inventory || [])]
      };

      const existingItemIndex = updatedDelegate.inventory.findIndex(
        item => item.benefitId === benefitId
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
          benefitId: benefitId,
          benefitName: selectedBenefit.name,
          stockAssigned: quantity,
          stockRemaining: quantity,
          dateAssigned: new Date().toISOString()
        });
      }

      // Actualizar el estado de los delegados
      setDelegates(delegates.map(d => 
        d.id === selectedDelegate.id ? updatedDelegate : d
      ));

      form.reset();
      toast.success('Stock asignado exitosamente');

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al asignar stock');
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

  const getDelegateDeliveries = (delegateId: number) => {
    return benefitDeliveries.filter(delivery => delivery.delegateId === delegateId);
  };

  const fetchSectors = async () => {
    try {
        const response = await fetch('http://localhost:5000/sectores', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Sectores cargados:', data);
        setSectors(data);
    } catch (error) {
        console.error('Error al cargar sectores:', error);
    }
  };

  // Agregar esta función para cargar delegados
  const fetchDelegates = async () => {
    try {
      const response = await fetch('http://localhost:5000/delegados', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Delegados cargados:', data);
      setDelegates(data);
    } catch (error) {
      console.error('Error al cargar delegados:', error);
    }
  };

  // Verificar si los datos están cargados
  useEffect(() => {
    console.log("Delegates:", delegates);
    console.log("Sectores:", sectors);
  }, [delegates, sectors]);

  // Modificar la función de filtrado para incluir el sector
  const filteredDelegates = safeDelegates.filter((delegate) =>
    delegate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedSector === "" || delegate.sector_id === parseInt(selectedSector))
  );

  const handleDeleteDelegateStock = async (benefitId: number, stockAssigned: number) => {
    if (!selectedDelegate) return;
    
    try {
      // Confirmar con el usuario
      if (!window.confirm('¿Está seguro que desea eliminar este stock? Esta acción devolverá el stock al beneficio original.')) {
        return;
      }

      // Actualizar el inventario del delegado
      const updatedDelegate = {
        ...selectedDelegate,
        inventory: selectedDelegate.inventory.filter(item => item.benefitId !== benefitId)
      };

      // Actualizar el stock general del beneficio
      const updatedBenefits = benefits.map(benefit => {
        if (benefit.id === benefitId) {
          return {
            ...benefit,
            stock: benefit.stock + stockAssigned
          };
        }
        return benefit;
      });

      // Actualizar estados
      setDelegates(delegates.map(d => 
        d.id === selectedDelegate.id ? updatedDelegate : d
      ));
      setBenefits(updatedBenefits);

      // Registrar el evento
      addEvent({
        eventType: 'delete',
        category: 'delegate_stock',
        description: `Eliminación de stock del delegado ${selectedDelegate.first_name} ${selectedDelegate.last_name}`,
        entityId: selectedDelegate.id,
        path: '/delegados'
      });

      alert('Stock eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el stock');
    }
  };

  const handleDeleteDelivery = async (delivery: BenefitDelivery) => {
    if (!selectedDelegate) return;

    try {
      // Confirmar con el usuario
      if (!window.confirm('¿Está seguro que desea eliminar esta entrega? Esta acción devolverá el stock al delegado.')) {
        return;
      }

      // Actualizar el inventario del delegado
      const updatedDelegate = {
        ...selectedDelegate,
        inventory: selectedDelegate.inventory.map(item => {
          if (item.benefitId === delivery.benefitId) {
            return {
              ...item,
              stockRemaining: item.stockRemaining + 1
            };
          }
          return item;
        })
      };

      // Eliminar la entrega del historial
      const updatedDeliveries = benefitDeliveries.filter(d => d.id !== delivery.id);

      // Actualizar estados
      setDelegates(delegates.map(d => 
        d.id === selectedDelegate.id ? updatedDelegate : d
      ));
      setBenefitDeliveries(updatedDeliveries);

      // Registrar el evento
      addEvent({
        eventType: 'delete',
        category: 'benefit_delivery',
        description: `Eliminación de entrega de ${delivery.benefitName} a ${delivery.affiliateName}`,
        entityId: delivery.id,
        path: '/delegados'
      });

      alert('Entrega eliminada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la entrega');
    }
  };

  const handleDeliverBenefit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDelegate) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('http://localhost:5000/delegados/deliver-benefit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegateId: selectedDelegate.id,
          affiliateId: formData.get('affiliateId'),
          benefitId: formData.get('benefitId'),
          childId: formData.get('childId') || null,
          quantity: parseInt(formData.get('quantity') as string) || 1,
          notes: formData.get('notes')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al entregar beneficio');
      }

      const data = await response.json();

      // Actualizar el inventario del delegado
      const updatedDelegate = {
        ...selectedDelegate,
        inventory: selectedDelegate.inventory.map(item => {
          if (item.benefitId === parseInt(formData.get('benefitId') as string)) {
            return {
              ...item,
              stockRemaining: item.stockRemaining - (parseInt(formData.get('quantity') as string) || 1)
            };
          }
          return item;
        })
      };

      setDelegates(delegates.map(d => 
        d.id === selectedDelegate.id ? updatedDelegate : d
      ));

      form.reset();
      alert(data.message);

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al entregar beneficio');
    }
  };

  const BenefitAssignmentForm = ({ delegate, onClose }: { delegate: Delegate; onClose: () => void }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { benefits } = useStorage();

    useEffect(() => {
      const loadBenefits = async () => {
        try {
          setLoading(true);
          const response = await fetch('http://localhost:5000/beneficios');
          if (!response.ok) {
            throw new Error('Error al cargar beneficios');
          }
          const data = await response.json();
          console.log('Beneficios cargados:', data);
        } catch (error) {
          console.error('Error:', error);
          setError(error instanceof Error ? error.message : 'Error al cargar beneficios');
        } finally {
          setLoading(false);
        }
      };

      loadBenefits();
    }, []);

    return (
      <form onSubmit={handleStockAssignment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Beneficio</label>
          <select
            name="benefitId"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            required
          >
            <option value="">Seleccione un beneficio</option>
            {loading ? (
              <option disabled>Cargando beneficios...</option>
            ) : benefits && benefits.length > 0 ? (
              benefits
                .filter(benefit => benefit.is_available && benefit.stock > 0)
                .map(benefit => (
                  <option key={benefit.id} value={benefit.id}>
                    {benefit.name} - {benefit.type} ({benefit.age_range}) - Stock: {benefit.stock}
                  </option>
                ))
            ) : (
              <option disabled>No hay beneficios disponibles</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            name="quantity"
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
          >
            Asignar Stock
          </button>
        </div>
      </form>
    );
  };

  // Agregar un useEffect para cargar los beneficios si no están ya cargados
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const response = await fetch('http://localhost:5000/beneficios');
        if (!response.ok) {
          throw new Error('Error al cargar beneficios');
        }
        const data = await response.json();
        console.log('Beneficios cargados en DelegatePage:', data);
        setBenefits(data);
      } catch (error) {
        console.error('Error al cargar beneficios:', error);
      }
    };

    if (!benefits || benefits.length === 0) {
      fetchBenefits();
    }
  }, [benefits, setBenefits]);

  const handleDeleteDelegate = async (delegateId: number) => {
    try {
      console.log('Intentando eliminar delegado:', delegateId); // Debug

      const response = await fetch(`http://localhost:5000/delegados/${delegateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el delegado');
      }

      // Actualizar el estado local eliminando el delegado
      setDelegates(prevDelegates => 
        prevDelegates.filter(delegate => delegate.id !== delegateId)
      );
      
      toast.success('Delegado eliminado con éxito');

    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el delegado');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Delegados</h1>
        <button 
          onClick={() => {
            setSelectedDelegate(null);
            setShowModal(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Delegado
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar delegados..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="">Todos los sectores</option>
            {safeSectors.map(sector => (
              <option key={sector.sector_id} value={sector.sector_id}>
                {sector.sector_name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sector
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
              {safeDelegates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay delegados disponibles
                  </td>
                </tr>
              ) : (
                filteredDelegates.map((delegate) => (
                  <tr key={delegate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {`${delegate.first_name} ${delegate.last_name}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{delegate.dni}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSectorName(delegate.sector_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        delegate.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {delegate.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewClick(delegate);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(delegate)}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Editar"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(delegate)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar delegado"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {selectedDelegate ? 'Editar Delegado' : 'Nuevo Delegado'}
            </h2>
            <form onSubmit={handleSubmitDelegate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  name="first_name"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedDelegate?.first_name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  name="last_name"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedDelegate?.last_name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DNI</label>
                <input
                  name="dni"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedDelegate?.dni}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sector</label>
                <select
                  name="sector_id"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedDelegate?.sector_id || ""}
                  required
                >
                  <option value="">Seleccione un sector</option>
                  {sectors && sectors.length > 0 ? (
                    sectors.map(sector => (
                      <option key={sector.sector_id} value={sector.sector_id}>
                        {sector.sector_name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Cargando sectores...</option>
                  )}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  defaultChecked={selectedDelegate ? selectedDelegate.is_active : true}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Activo
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Confirmar eliminación</h2>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea eliminar al delegado{' '}
              <span className="font-semibold">{delegateToDelete?.first_name} {delegateToDelete?.last_name}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDelegateToDelete(null);
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showHistoryModal && selectedDelegate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Stock</h2>
                <p className="text-gray-600">
                  {selectedDelegate.first_name} {selectedDelegate.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedDelegate(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulario de Asignación de Stock */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Asignar Stock</h3>
                <BenefitAssignmentForm delegate={selectedDelegate} onClose={() => setShowHistoryModal(false)} />
              </div>

              {/* Resumen de Stock y Entregas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Stock Actual y Entregas</h3>
                <div className="space-y-4">
                  {/* Resumen de Stock */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Stock Disponible</h4>
                    {selectedDelegate.inventory && selectedDelegate.inventory.length > 0 ? (
                      selectedDelegate.inventory.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.benefitName}</h4>
                              <p className="text-sm text-gray-600">
                                Stock asignado: {item.stockAssigned} unidades
                              </p>
                              <p className="text-sm text-gray-600">
                                Stock restante: {item.stockRemaining} unidades
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                Asignado el: {formatDate(item.dateAssigned)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No hay stock asignado</p>
                    )}
                  </div>

                  {/* Historial de Entregas */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Historial de Entregas</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {benefitDeliveries
                        .filter(delivery => delivery.delegateId === selectedDelegate.id)
                        .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
                        .map((delivery, index) => (
                          <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{delivery.benefitName}</p>
                                <p className="text-sm text-gray-600">
                                  Entregado a: {delivery.recipientType === 'affiliate' 
                                    ? delivery.affiliateName 
                                    : `${delivery.childName} (Hijo/a de ${delivery.affiliateName})`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {formatDate(delivery.deliveryDate)}
                                </span>
                                <button
                                  onClick={() => handleDeleteDelivery(delivery)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Eliminar entrega"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {benefitDeliveries.filter(d => d.delegateId === selectedDelegate.id).length === 0 && (
                        <p className="text-gray-500 text-center py-2">No hay entregas registradas</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DelegatePage;