import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useProperties, Property } from './useProperties';

interface SelectedPropertyContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  isLoading: boolean;
  properties: Property[];
}

const SelectedPropertyContext = createContext<SelectedPropertyContextType | undefined>(undefined);

export const SelectedPropertyProvider = ({ children }: { children: ReactNode }) => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // FASE 1: Carregar do localStorage na montagem (APENAS 1x)
  useEffect(() => {
    const storedId = localStorage.getItem('selectedPropertyId');
    if (storedId) {
      setSelectedPropertyIdState(storedId);
    }
    setHasInitialized(true);
  }, []); // ⚠️ CRITICAL: Array vazio = executa APENAS na montagem

  // FASE 2: Auto-selecionar primeira propriedade se necessário
  useEffect(() => {
    if (!hasInitialized || propertiesLoading) return;

    if (!selectedPropertyId && properties.length > 0) {
      const firstPropertyId = properties[0].id;
      setSelectedPropertyIdState(firstPropertyId);
      localStorage.setItem('selectedPropertyId', firstPropertyId);
    }

    if (selectedPropertyId && properties.length > 0 && !properties.find(p => p.id === selectedPropertyId)) {
      setSelectedPropertyIdState(null);
      localStorage.removeItem('selectedPropertyId');
    }
  }, [properties, propertiesLoading, selectedPropertyId, hasInitialized]);

  const setSelectedPropertyId = (id: string | null) => {
    setSelectedPropertyIdState(id);
    if (id) {
      localStorage.setItem('selectedPropertyId', id);
    } else {
      localStorage.removeItem('selectedPropertyId');
    }
  };

  return (
    <SelectedPropertyContext.Provider
      value={{
        selectedPropertyId,
        setSelectedPropertyId,
        isLoading: !hasInitialized || propertiesLoading,
        properties,
      }}
    >
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