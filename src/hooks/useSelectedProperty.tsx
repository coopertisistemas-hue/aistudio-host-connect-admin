import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useProperties } from './useProperties';

interface SelectedPropertyContextType {
  selectedPropertyId: string | undefined;
  setSelectedPropertyId: (id: string | undefined) => void;
  isLoading: boolean;
}

const SelectedPropertyContext = createContext<SelectedPropertyContextType | undefined>(undefined);

export const SelectedPropertyProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const [selectedPropertyId, setInternalSelectedPropertyId] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // DO NOT initialize if auth is still loading or properties are still loading
    if (authLoading || propertiesLoading) return;

    // Additionally, if we are logged in but have no properties yet, we might still be initializing.
    // But if properties query finished and is empty, we must continue to allow "No property" state.

    const storedId = localStorage.getItem('selectedPropertyId');
    const defaultId = properties.length > 0 ? properties[0].id : undefined;

    let initialId = defaultId;

    if (storedId && properties.some(p => p.id === storedId)) {
      initialId = storedId;
    }

    console.log('[SelectedPropertyProvider] Initializing with ID:', initialId, 'Properties found:', properties.length);
    setInternalSelectedPropertyId(initialId);
    setIsInitialized(true);
  }, [authLoading, propertiesLoading, properties]);

  const setSelectedPropertyId = (id: string | undefined) => {
    setInternalSelectedPropertyId(id);
    if (id) {
      localStorage.setItem('selectedPropertyId', id);
    } else {
      localStorage.removeItem('selectedPropertyId');
    }
  };

  const isLoading = authLoading || propertiesLoading || !isInitialized;

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