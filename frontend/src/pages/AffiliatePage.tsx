import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Pencil, Trash2, Eye, AlertTriangle, Gift } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { toast } from 'react-hot-toast';

interface Child {
  child_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  dni?: string;
  gender: string;
  has_disability: boolean;
  notes?: string;
  created_at: string;
}

interface Affiliate {
  id_associate: number;
  affiliate_code: string;
  affiliate_name: string;
  dni: string;
  gender: 'M' | 'F' | 'O';
  email: string;
  phone: string;
  sector_id: number;
  has_children: boolean;
  has_disability: boolean;
  children?: Child[];
}

interface Sector {
  sector_id: number;
  sector_name: string;
  code?: string;
}

interface Benefit {
  id: number;
  name: string;
  type: string;
  age_range: string;
  stock: number;
  status: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Agregar esta función antes del componente AffiliatePage
const getAffiliateDeliveries = (affiliateId: number) => {
  const { benefitDeliveries, benefits, delegates } = useStorage();
  
  return benefitDeliveries
    .filter(delivery => delivery.affiliate_id === affiliateId)
    .map(delivery => ({
      id: `${delivery.benefit_id}-${delivery.delivery_date}`,
      benefitId: delivery.benefit_id,
      benefitName: delivery.benefit_name,
      affiliateId: delivery.affiliate_id,
      affiliateName: delivery.affiliate_name,
      childId: delivery.child_id,
      childName: delivery.child_name,
      delegateId: delivery.delegate_id,
      delegateName: delivery.delegate_name,
      deliveryDate: delivery.delivery_date,
      recipientType: delivery.recipient_type
    }));
};

function AffiliatePage() {
  const { 
    affiliates, 
    setAffiliates,
    children,
    benefits,
    setBenefits,
    delegates,
    setDelegates,
    benefitDeliveries,
    setBenefitDeliveries,
    setChildren
  } = useStorage();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [affiliateToDelete, setAffiliateToDelete] = useState<Affiliate | null>(null);
  const [selectedRecipientType, setSelectedRecipientType] = useState<'affiliate' | 'child'>('affiliate');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>("");

  // Función para cargar afiliados desde la base de datos
  const fetchAffiliates = async () => {
    try {
      const response = await fetch('http://localhost:5000/afiliados');
      if (response.ok) {
        const data = await response.json();
        setAffiliates(data);
      }
    } catch (error) {
      console.error('Error al cargar afiliados:', error);
      setErrorMessage('Error al cargar los afiliados');
      setShowErrorModal(true);
    }
  };

  // Función para cargar sectores
  const fetchSectors = async () => {
    try {
      console.log('Iniciando fetchSectors');
      const response = await fetch('http://localhost:5000/sectors');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos de sectores recibidos:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('Primer sector:', data[0]);
          setSectors(data);
        } else {
          console.error('No se recibieron sectores del backend');
        }
      } else {
        const errorText = await response.text();
        console.error('Error al cargar sectores:', errorText);
      }
    } catch (error) {
      console.error('Error en fetchSectors:', error);
    }
  };

  // Cargar afiliados al montar el componente
  useEffect(() => {
    console.log('useEffect ejecutándose');
    const loadData = async () => {
      await fetchSectors(); // Cargar sectores primero
      await fetchAffiliates(); // Luego cargar afiliados
    };
    loadData();
  }, []);

  // Función para crear/actualizar afiliado
  const handleSubmitAffiliate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const affiliateData = {
      affiliate_code: formData.get('affiliate_code'),
      affiliate_name: formData.get('affiliate_name'),
      dni: formData.get('dni'),
      gender: formData.get('gender'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      sector_id: Number(formData.get('sector_id')),
      has_children: formData.get('has_children') === 'on',
      has_disability: formData.get('has_disability') === 'on'
    };

    try {
      const url = selectedAffiliate 
        ? `http://localhost:5000/afiliados/${selectedAffiliate.id_associate}`
        : 'http://localhost:5000/afiliados';
      
      const response = await fetch(url, {
        method: selectedAffiliate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(affiliateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el afiliado');
      }

      const data = await response.json();
      
      // Actualizar la lista de afiliados
      if (selectedAffiliate) {
        setAffiliates(affiliates.map(a => 
          a.id_associate === selectedAffiliate.id_associate ? data : a
        ));
        toast.success('Afiliado actualizado con éxito');
      } else {
        setAffiliates([...affiliates, data]);
        toast.success('Afiliado creado con éxito');
      }

      // Limpiar el formulario y cerrar el modal
      setShowModal(false);
      setSelectedAffiliate(null);

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el afiliado');
    }
  };

  // Función para eliminar afiliado
  const handleDeleteConfirm = async () => {
    if (!affiliateToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/afiliados/${affiliateToDelete.id_associate}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el afiliado');
      }

      // Actualizar el estado local eliminando el afiliado
      setAffiliates(prevAffiliates => 
        prevAffiliates.filter(a => a.id_associate !== affiliateToDelete.id_associate)
      );

      // Cerrar el modal y limpiar el estado
      setShowDeleteModal(false);
      setAffiliateToDelete(null);
      
      // Mostrar mensaje de éxito
      toast.success('Afiliado eliminado con éxito');

    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el afiliado');
    }
  };

  const handleDeliverBenefit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAffiliate) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      // Crear el objeto de datos
      const deliveryData = {
        benefitId: parseInt(formData.get('benefitId') as string),
        affiliateId: selectedAffiliate.id_associate,
        delegateId: parseInt(formData.get('delegateId') as string),
        recipientType: formData.get('recipientType'),
        childId: formData.get('recipientType') === 'child' ? 
          parseInt(formData.get('childId') as string) : null
      };

      console.log('Enviando datos:', deliveryData);

      const response = await fetch('http://localhost:5000/benefit-deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deliveryData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al entregar el beneficio');
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local
        const updatedBenefits = benefits.map(benefit => {
          if (benefit.id === deliveryData.benefitId) {
            return { ...benefit, stock: benefit.stock - 1 };
          }
          return benefit;
        });
        setBenefits(updatedBenefits);

        // Actualizar entregas
        setBenefitDeliveries([...benefitDeliveries, data.delivery]);

        toast.success('Beneficio entregado exitosamente');
        setShowBenefitsModal(false);
      } else {
        throw new Error(data.error || 'Error al entregar el beneficio');
      }

    } catch (error) {
      console.error('Error al entregar beneficio:', error);
      toast.error(error instanceof Error ? error.message : 'Error al entregar beneficio');
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

  const [searchTerm, setSearchTerm] = useState("");

  const BenefitDeliveryForm = ({ affiliate, onClose }: { affiliate: Affiliate; onClose: () => void }) => {
    const { benefits } = useStorage();
    const [selectedRecipientType, setSelectedRecipientType] = useState<'affiliate' | 'child'>('affiliate');
    const [children, setChildren] = useState<Child[]>([]);

    useEffect(() => {
      const fetchChildren = async () => {
        try {
          const response = await fetch(`http://localhost:5000/afiliados/${affiliate.id_associate}/children`);
          if (!response.ok) {
            throw new Error('Error al cargar los hijos');
          }
          const data = await response.json();
          setChildren(data);
        } catch (error) {
          console.error('Error al cargar los hijos:', error);
          toast.error('Error al cargar la lista de hijos');
        }
      };

      if (affiliate.has_children) {
        fetchChildren();
      }
    }, [affiliate.id_associate, affiliate.has_children]);

    return (
      <form onSubmit={handleDeliverBenefit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Beneficio</label>
          <select
            name="benefitId"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            required
          >
            <option value="">Seleccione un beneficio</option>
            {benefits.filter(benefit => benefit.is_available && benefit.stock > 0)
              .map(benefit => (
                <option key={benefit.id} value={benefit.id}>
                  {benefit.name} - Stock: {benefit.stock}
                </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Destinatario</label>
          <select
            name="recipientType"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            value={selectedRecipientType}
            onChange={(e) => setSelectedRecipientType(e.target.value as 'affiliate' | 'child')}
            required
          >
            <option value="affiliate">Afiliado</option>
            {affiliate.has_children && <option value="child">Hijo/a</option>}
          </select>
        </div>

        {selectedRecipientType === 'child' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Hijo/a</label>
            <select
              name="childId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              required
            >
              <option value="">Seleccione un hijo/a</option>
              {children.map(child => (
                <option key={child.child_id} value={child.child_id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Delegado</label>
          <select
            name="delegateId"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            required
          >
            <option value="">Seleccione un delegado</option>
            {delegates.map(delegate => (
              <option key={delegate.id} value={delegate.id}>
                {delegate.first_name} {delegate.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
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
            Entregar Beneficio
          </button>
        </div>
      </form>
    );
  };

  // Modificar la función de filtrado para incluir tanto la búsqueda por nombre como por sector
  const filteredAffiliates = affiliates.filter((affiliate) =>
    affiliate.affiliate_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedSector === "" || affiliate.sector_id === parseInt(selectedSector))
  );

  // Función para manejar el filtro por sector
  const handleSectorFilter = (sectorId: string) => {
    setSelectedSector(sectorId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Afiliados</h1>
        <button 
          onClick={() => {
            setSelectedAffiliate(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-md bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Afiliado
        </button>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar afiliados..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedSector}
            onChange={(e) => handleSectorFilter(e.target.value)}
          >
            <option value="">Todos los sectores</option>
            {sectors.map(sector => (
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
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  DNI
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Sector
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAffiliates.map((affiliate) => (
                <tr key={affiliate.id_associate}>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {affiliate.affiliate_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {affiliate.affiliate_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {affiliate.dni}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <div>
                      <div>{affiliate.phone}</div>
                      <div className="text-gray-500">{affiliate.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {(() => {
                      console.log('Sectores disponibles:', sectors);
                      console.log('Sector ID del afiliado:', affiliate.sector_id);
                      const foundSector = sectors.find(s => s.sector_id === affiliate.sector_id);
                      console.log('Sector encontrado:', foundSector);
                      return foundSector ? foundSector.sector_name : 'No asignado';
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <span className="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowBenefitsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Entregar beneficio"
                      >
                        <Gift className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setAffiliateToDelete(affiliate);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
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
      </div>

      {/* Benefits Modal */}
      {showBenefitsModal && selectedAffiliate && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-4xl p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Beneficios</h2>
                <p className="text-gray-600">
                  {selectedAffiliate.affiliate_name} - DNI: {selectedAffiliate.dni}
                </p>
              </div>
              <button
                onClick={() => setShowBenefitsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Formulario de entrega */}
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Entregar Nuevo Beneficio</h3>
                <BenefitDeliveryForm affiliate={selectedAffiliate} onClose={() => setShowBenefitsModal(false)} />
              </div>

              {/* Historial de beneficios */}
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Historial de Beneficios</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {getAffiliateDeliveries(selectedAffiliate.id_associate)
                    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
                    .map((delivery) => (
                      <div
                        key={delivery.id}
                        className="relative p-4 bg-white rounded-md shadow-sm group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {delivery.benefitName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Entregado a: {delivery.recipientType === 'affiliate' 
                                ? delivery.affiliateName 
                                : `${delivery.childName} (Hijo/a)`
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              Entregado por: {delivery.delegateName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {formatDate(delivery.deliveryDate)}
                            </span>
                            <button
                              onClick={() => {
                                // Find the delegate who delivered this benefit
                                const delegate = delegates.find(d => d.id === delivery.delegateId);
                                if (delegate) {
                                  // Update delegate's inventory
                                  const updatedDelegates = delegates.map(d => {
                                    if (d.id === delegate.id) {
                                      const updatedInventory = d.inventory.map(item => {
                                        if (item.benefitId === delivery.benefitId) {
                                          return {
                                            ...item,
                                            stockRemaining: item.stockRemaining + 1
                                          };
                                        }
                                        return item;
                                      });
                                      return {
                                        ...d,
                                        inventory: updatedInventory
                                      };
                                    }
                                    return d;
                                  });
                                  setDelegates(updatedDelegates);

                                  // Remove the delivery from the list
                                  setBenefitDeliveries(benefitDeliveries.filter(d => d.id !== delivery.id));

                                  // If the recipient is a child, update their active benefits
                                  if (delivery.recipientType === 'child' && delivery.childId) {
                                    const updatedChildren = children.map(child => {
                                      if (child.id === delivery.childId) {
                                        return {
                                          ...child,
                                          activeBenefits: child.activeBenefits.filter(b => b !== delivery.benefitName)
                                        };
                                      }
                                      return child;
                                    });
                                    setChildren(updatedChildren);
                                  }

                                  // Add event to history
                                  addEvent({
                                    eventType: 'delete',
                                    category: 'benefit',
                                    description: `Cancelación de entrega: ${delivery.benefitName} a ${
                                      delivery.recipientType === 'affiliate' 
                                        ? delivery.affiliateName 
                                        : `${delivery.childName}`
                                    }`,
                                    entityId: delivery.id,
                                    path: '/afiliados'
                                  });
                                }
                              }}
                              className="text-red-600 transition-opacity opacity-0 hover:text-red-900 group-hover:opacity-100"
                              title="Eliminar entrega"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {getAffiliateDeliveries(selectedAffiliate.id_associate).length === 0 && (
                    <p className="py-4 text-center text-gray-500">
                      No hay beneficios entregados aún
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && affiliateToDelete && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Confirmar eliminación</h2>
            <p className="mb-4 text-gray-600">
              ¿Está seguro que desea eliminar al afiliado {affiliateToDelete.affiliate_name}?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAffiliateToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-2xl font-bold">
              {selectedAffiliate ? 'Editar Afiliado' : 'Nuevo Afiliado'}
            </h2>
            <form onSubmit={handleSubmitAffiliate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código de Afiliado</label>
                <input
                  name="affiliate_code"
                  type="text"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedAffiliate?.affiliate_code || ''}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input
                  name="affiliate_name"
                  type="text"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedAffiliate?.affiliate_name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DNI</label>
                <input
                  name="dni"
                  type="text"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedAffiliate?.dni}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Género</label>
                <select
                  name="gender"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedAffiliate?.gender}
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    defaultValue={selectedAffiliate?.email}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    name="phone"
                    type="tel"
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    defaultValue={selectedAffiliate?.phone}
                    placeholder="11-1234-5678"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sector</label>
                <select
                  name="sector_id"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedAffiliate?.sector_id || ""}
                  required
                >
                  <option value="">Seleccione un sector</option>
                  {sectors.map(sector => (
                    <option key={sector.sector_id} value={sector.sector_id}>
                      {sector.sector_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    name="has_children"
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded text-emerald-600 focus:ring-emerald-500"
                    defaultChecked={selectedAffiliate?.has_children}
                  />
                  <label className="block ml-2 text-sm text-gray-700">
                    Tiene hijos
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    name="has_disability"
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded text-emerald-600 focus:ring-emerald-500"
                    defaultChecked={selectedAffiliate?.has_disability}
                  />
                  <label className="block ml-2 text-sm text-gray-700">
                    Tiene discapacidad
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAffiliate(null);
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Error de Stock</h2>
            </div>
            <p className="mb-6 text-gray-600">
              {errorMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AffiliatePage;