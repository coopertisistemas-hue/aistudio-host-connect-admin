import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useProperties } from './useProperties';

interface SelectedPropertyContextType {
  selectedPropertyId: string | undefined;
  setSelectedPropertyId: (id: string | undefined) => void;
  isLoading: boolean;
}

const SelectedPropertyContext = createContext<SelectedPropertyContextType | undefined>(undefined);

export const SelectedPropertyProvider = ({ children }: { children: ReactNode }) => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const [selectedPropertyId, setInternalSelectedPropertyId] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (propertiesLoading) return;

    const storedId = localStorage.getItem('selectedPropertyId');
    const defaultId = properties.length > 0 ? properties[0].id : undefined;

    let initialId = defaultId;

    if (storedId && properties.some(p => p.id === storedId)) {
      initialId = storedId;
    }

    setInternalSelectedPropertyId(initialId);
    setIsInitialized(true);
  }, [propertiesLoading, properties]);

  const setSelectedPropertyId = (id: string | undefined) => {
    setInternalSelectedPropertyId(id);
    if (id) {
      localStorage.setItem('selectedPropertyId', id);
    } else {
      localStorage.removeItem('selectedPropertyId');
    }
  };

  const isLoading = propertiesLoading || !isInitialized;

  return (
    <SelectedPropertyContext.Provider value={{ selectedPropertyId, setSelectedPropertyId, isLoading }}>
      {children}
    </SelectedPropertyContext.Provider>
  );
};

export const useSelectedProperty = () => {
  const context = useContext(SelectedPropertyContext);
  if (context === undefined) {
    throw new Error('useSelectedProperty must be used within a SelectedPropertyProvider');
  }
  return context;
};