import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Affiliate {
  id: number;
  affiliate_code: string;
  affiliate_name: string;
  dni: string;
  gender: 'M' | 'F' | 'O';
  email: string;
  phone: string;
  sector_id: string;
  has_children: boolean;
  has_disability: boolean;
}

interface Child {
  child_id: number;
  affiliate_id: number; // Asegúrate de que este campo esté presente
  first_name: string;
  last_name: string;
  birth_date: string;
  dni: string;
  gender: string;
  has_disability: boolean;
  notes: string;
  created_at: string;
}

interface Benefit {
  id: number;
  name: string;
  type: string;
  age_range: string;
  stock: number;
  stock_rest: number;
  status: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

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
}

interface DelegateInventory {
  benefitId: number;
  benefitName: string;
  stockAssigned: number;
  stockRemaining: number;
  dateAssigned: string;
}

interface BenefitDelivery {
  benefitId: number;
  benefitName: string;
  affiliateId: number;
  affiliateName: string;
  childId?: number;
  childName?: string;
  delegateId: number;
  delegateName: string;
  deliveryDate: string;
  recipientType: 'affiliate' | 'child';
}

interface Sector {
  sector_id: number;
  name: string;
}

interface DelegateAssignment {
  id: number;
  delegate_id: number;
  benefit_id: number;
  quantity: number;
  date_assigned: string;
  stock_remaining: number;
}

interface StorageContextType {
  affiliates: Affiliate[];
  setAffiliates: (affiliates: Affiliate[]) => void;
  children: Child[];
  setChildren: (children: Child[]) => void;
  benefits: Benefit[];
  setBenefits: (benefits: Benefit[]) => void;
  delegates: Delegate[];
  setDelegates: (delegates: Delegate[]) => void;
  benefitDeliveries: BenefitDelivery[];
  setBenefitDeliveries: (deliveries: BenefitDelivery[]) => void;
  sectors: Sector[];
  setSectors: (sectors: Sector[]) => void;
  delegateAssignments: DelegateAssignment[];
  setDelegateAssignments: (assignments: DelegateAssignment[]) => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const STORAGE_KEYS = {
  AFFILIATES: 'ate_affiliates',
  CHILDREN: 'children',
  BENEFITS: 'ate_benefits',
  DELEGATES: 'delegates',
  BENEFIT_DELIVERIES: 'ate_benefit_deliveries',
  SECTORS: 'sectors'
};

export function StorageProvider({ children: content }: { children: ReactNode }) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [children, setChildren] = useState<Child[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHILDREN);
    return stored ? JSON.parse(stored) : [];
  });

  const [benefits, setBenefits] = useState<Benefit[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.BENEFITS);
    return stored ? JSON.parse(stored) : [];
  });

  const [delegates, setDelegates] = useState<Delegate[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.DELEGATES);
    return stored ? JSON.parse(stored) : [];
  });

  const [benefitDeliveries, setBenefitDeliveries] = useState<BenefitDelivery[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.BENEFIT_DELIVERIES);
    return stored ? JSON.parse(stored) : [];
  });

  const [sectors, setSectors] = useState<Sector[]>([]);

  const [delegateAssignments, setDelegateAssignments] = useState<DelegateAssignment[]>([]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const response = await axios.get('http://localhost:5000/afiliados');
        const afiliatesData = response.data;
        setAffiliates(afiliatesData);
        localStorage.setItem(STORAGE_KEYS.AFFILIATES, JSON.stringify(afiliatesData));
      } catch (error) {
        console.error('Error fetching affiliates:', error);
        const stored = localStorage.getItem(STORAGE_KEYS.AFFILIATES);
        if (stored) {
          setAffiliates(JSON.parse(stored));
        }
      }
    };

    fetchAffiliates();
  }, []);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await axios.get('http://localhost:5000/children');
        const childrenData = response.data;
        setChildren(childrenData);
        localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(childrenData));
      } catch (error) {
        console.error('Error fetching children:', error);
        const stored = localStorage.getItem(STORAGE_KEYS.CHILDREN);
        if (stored) {
          setChildren(JSON.parse(stored));
        }
      }
    };
  
    fetchChildren();
  }, []);

  useEffect(() => {
    const fetchDelegates = async () => {
      try {
        const response = await axios.get('http://localhost:5000/delegates');
        setDelegates(response.data);
      } catch (error) {
        console.error('Error fetching delegates:', error);
        const storedDelegates = localStorage.getItem(STORAGE_KEYS.DELEGATES);
        if (storedDelegates) {
          setDelegates(JSON.parse(storedDelegates));
        }
      }
    };

    fetchDelegates();
  }, []);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/sectors');
        setSectors(response.data);
      } catch (error) {
        console.error('Error fetching sectors:', error);
        const storedSectors = localStorage.getItem(STORAGE_KEYS.SECTORS);
        if (storedSectors) {
          setSectors(JSON.parse(storedSectors));
        }
      }
    };

    fetchSectors();
  }, []);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const response = await axios.get('http://localhost:5000/benefits');
        const benefitsData = response.data;
        console.log('Beneficios recibidos:', benefitsData); // Debug
        setBenefits(benefitsData);
        localStorage.setItem(STORAGE_KEYS.BENEFITS, JSON.stringify(benefitsData));
      } catch (error) {
        console.error('Error fetching benefits:', error);
        const stored = localStorage.getItem(STORAGE_KEYS.BENEFITS);
        if (stored) {
          setBenefits(JSON.parse(stored));
        }
      }
    };

    fetchBenefits();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AFFILIATES, JSON.stringify(affiliates));
  }, [affiliates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  }, [children]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BENEFITS, JSON.stringify(benefits));
  }, [benefits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELEGATES, JSON.stringify(delegates));
  }, [delegates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BENEFIT_DELIVERIES, JSON.stringify(benefitDeliveries));
  }, [benefitDeliveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
  }, [sectors]);

  const loadDelegateAssignments = async () => {
    try {
      const response = await fetch('http://localhost:5000/delegate-assignments');
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      const data = await response.json();
      setDelegateAssignments(data);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
    }
  };

  useEffect(() => {
    loadDelegateAssignments();
  }, []);

  const value = {
    affiliates,
    setAffiliates,
    children,
    setChildren,
    benefits,
    setBenefits,
    delegates,
    setDelegates,
    benefitDeliveries,
    setBenefitDeliveries,
    sectors,
    setSectors,
    delegateAssignments,
    setDelegateAssignments,
  };

  return <StorageContext.Provider value={value}>{content}</StorageContext.Provider>;
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}