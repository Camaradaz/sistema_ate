import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HistoryEvent {
  id: number;
  date: string;
  eventType: 'create' | 'update' | 'delete';
  category: 'affiliate' | 'child' | 'delegate' | 'benefit';
  user: string;
  description: string;
  entityId: number;
  path: string;
}

interface HistoryContextType {
  events: HistoryEvent[];
  addEvent: (event: Omit<HistoryEvent, 'id' | 'date' | 'user'>) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);

  const addEvent = (eventData: Omit<HistoryEvent, 'id' | 'date' | 'user'>) => {
    const newEvent: HistoryEvent = {
      id: events.length + 1,
      date: new Date().toISOString(),
      user: 'Administrador', // Default admin user
      ...eventData
    };

    setEvents(prevEvents => [newEvent, ...prevEvents]);
  };

  return (
    <HistoryContext.Provider value={{ events, addEvent }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}