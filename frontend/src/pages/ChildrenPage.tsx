import React, { useState } from 'react';
import { Search, Plus, Pencil, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { useStorage } from '../context/StorageContext';
import { toast } from 'react-hot-toast';

interface Child {
  child_id: number;
  affiliate_id: number
  first_name: string;
  last_name: string;
  birth_date: string;
  dni: string;
  gender: string;
  has_disability: boolean;
  notes: string;
  created_at: string;
}

interface Affiliate {
  id_associate: number;
  affiliate_code: number;
  affiliate_name: string;
  dni: string;
  gender: 'M' | 'F' | 'O';
  contact: string;
  sector_id: number;
  has_children: boolean;
  has_disability: boolean;
  created_at: string;
}

function ChildrenPage() {
  const { addEvent } = useHistory();
  const { 
    children, 
    setChildren,
    benefitDeliveries,
    benefits,
    delegates,
    affiliates
  } = useStorage();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [affiliateError, setAffiliateError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleEdit = (child: Child) => {
    setSelectedChild(child);
    setShowModal(true);
    setAffiliateError('');
  };

  const handleDeleteClick = (child: Child) => {
    setChildToDelete(child);
    setShowDeleteModal(true);
  };

  const handleViewBenefits = (child: Child) => {
    setSelectedChild(child);
    setShowBenefitsModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!childToDelete) return;

    try {
      console.log('Intentando eliminar hijo:', childToDelete.child_id);
      
      const response = await fetch(`http://localhost:5000/hijos/${childToDelete.child_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      console.log('Response status:', response.status); // Debug

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: No se pudo eliminar el hijo`);
      }

      // Actualizar el estado local
      setChildren(prevChildren => 
        prevChildren.filter(child => child.child_id !== childToDelete.child_id)
      );
      
      // Registrar el evento
      addEvent({
        eventType: 'delete',
        category: 'child',
        description: `Se eliminó el hijo: ${childToDelete.first_name} ${childToDelete.last_name}`,
        entityId: childToDelete.child_id,
        path: '/hijos'
      });

      // Cerrar el modal y limpiar el estado
      setShowDeleteModal(false);
      setChildToDelete(null);
      
      // Mostrar mensaje de éxito
      toast.success('Hijo eliminado con éxito');

    } catch (error) {
      console.error('Error al eliminar hijo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el hijo');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const childData = {
        affiliate_id: parseInt(formData.get('affiliate_id') as string),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        birth_date: formData.get('birth_date'),
        dni: formData.get('dni'),
        gender: formData.get('gender'),
        has_disability: formData.get('has_disability') === 'true',
        notes: formData.get('notes') || ''
      };

      console.log('Enviando datos:', childData); // Debug

      const url = selectedChild 
        ? `http://localhost:5000/hijos/${selectedChild.child_id}`
        : 'http://localhost:5000/hijos';

      const response = await fetch(url, {
        method: selectedChild ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(childData)
      });

      console.log('Response status:', response.status); // Debug

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el hijo');
      }

      const savedChild = await response.json();
      console.log('Datos guardados:', savedChild); // Debug

      if (selectedChild) {
        // Actualizar hijo existente
        setChildren(children.map(c => 
          c.child_id === selectedChild.child_id ? savedChild : c
        ));
        toast.success('Hijo actualizado con éxito');
      } else {
        // Agregar nuevo hijo
        setChildren([...children, savedChild]);
        toast.success('Hijo registrado con éxito');
      }

      setShowModal(false);
      setSelectedChild(null);
      setAffiliateError('');

    } catch (error) {
      console.error('Error completo:', error);
      setAffiliateError(error instanceof Error ? error.message : 'Error al guardar el hijo');
      toast.error('Error al guardar el hijo');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getChildBenefits = (childId: number) => {
    return benefitDeliveries.filter(
      delivery => delivery.childId === childId && delivery.recipientType === 'child'
    );
  };

  const getBenefitName = (benefitId: number) => {
    const benefit = benefits.find(b => b.id === benefitId);
    return benefit?.name || 'Beneficio no encontrado';
  };

  const getDelegateName = (delegateId: number) => {
    const delegate = delegates.find(d => d.id === delegateId);
    return delegate?.name || 'Delegado no encontrado';
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getAffiliateName = (affiliateId: number) => {
    const affiliate = affiliates.find(a => a.id_associate === affiliateId);
    return affiliate ? affiliate.affiliate_name : 'No encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Hijos de Afiliados</h1>
        <button 
          onClick={() => {
            setSelectedChild(null);
            setShowModal(true);
            setAffiliateError('');
          }}
          className="flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-md bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-5 h-5" />
          Nuevo Registro
        </button>
      </div>
           
      {/* Barra de búsqueda con mejor manejo de eventos */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o DNI del afiliado..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Todas las edades</option>
            <option value="0-5">0-5 años</option>
            <option value="6-12">6-12 años</option>
            <option value="13-18">13-18 años</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Nombre del Hijo
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  DNI
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Afiliado
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Fecha de Nacimiento
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Edad
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Beneficios Activos
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Discapacidad
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {children.filter((child) =>
                child.first_name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((child) => (
                <tr key={child.child_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {`${child.first_name} ${child.last_name}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {child.dni}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {getAffiliateName(child.affiliate_id)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {formatDate(child.birth_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {calculateAge(child.birth_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {getChildBenefits(child.child_id).length}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {child.has_disability ? 'Sí' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => handleViewBenefits(child)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver beneficios"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(child)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(child)}
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

        <div className="flex items-center justify-between mt-4">
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
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-2xl font-bold">
              {selectedChild ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Afiliado Responsable</label>
                <select
                  name="affiliate_id"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.affiliate_id}
                  required
                >
                  <option value="">Seleccione un afiliado</option>
                  {affiliates.map(affiliate => (
                    <option key={affiliate.id_associate} value={affiliate.id_associate}>
                      {affiliate.affiliate_name} - DNI: {affiliate.dni}
                    </option>
                  ))}
                </select>
                {affiliateError && (
                  <p className="mt-1 text-sm text-red-600">{affiliateError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  name="first_name"
                  type="text"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.first_name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  name="last_name"
                  type="text"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.last_name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DNI</label>
                <input
                  name="dni"
                  type="text"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.dni}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                <input
                  name="birth_date"
                  type="date"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.birth_date}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Género</label>
                <select
                  name="gender"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.gender}
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">¿Tiene discapacidad?</label>
                <input
                  name="has_disability"
                  type="checkbox"
                  className="mt-1 border-gray-300 rounded text-emerald-600 focus:ring-emerald-500"
                  defaultChecked={selectedChild?.has_disability}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  name="notes"
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  defaultValue={selectedChild?.notes}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setAffiliateError('');
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && childToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
            </div>
            <p className="mb-6 text-gray-600">
              ¿Está seguro que desea eliminar a {childToDelete.first_name} {childToDelete.last_name}?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChildToDelete(null);
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

      {/* Benefits History Modal */}
      {showBenefitsModal && selectedChild && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Historial de Beneficios</h2>
                <p className="text-gray-600">
                  {`${selectedChild.first_name} ${selectedChild.last_name}`} - {selectedChild.age} años
                </p>
                <p className="text-sm text-gray-500">
                  Afiliado: {selectedChild.affiliate_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBenefitsModal(false);
                  setSelectedChild(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {getChildBenefits(selectedChild.child_id).map((delivery) => (
                <div
                  key={delivery.id}
                  className="p-4 rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{getBenefitName(delivery.benefitId)}</h4>
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
              {getChildBenefits(selectedChild.child_id).length === 0 && (
                <p className="py-4 text-center text-gray-500">
                  No hay beneficios entregados aún
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChildrenPage;