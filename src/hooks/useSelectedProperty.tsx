import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useProperties } from './useProperties';

interface SelectedPropertyContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  isLoading: boolean;
  properties: any[];
}

const SelectedPropertyContext = createContext<SelectedPropertyContextType | undefined>(undefined);

/**
 * Provedor para gerenciar a propriedade selecionada globalmente
 * Usa localStorage para persistir a seleção entre sessões
 */
export const SelectedPropertyProvider = ({ children }: { children: ReactNode }) => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ FASE 1: Carregar do localStorage na montagem
  useEffect(() => {
    console.log('[SelectedPropertyProvider] Mounting, loading from localStorage...');
    const storedId = localStorage.getItem('selectedPropertyId');

    if (storedId) {
      console.log('[SelectedPropertyProvider] Found stored ID:', storedId);
      setSelectedPropertyIdState(storedId);
    }

    // Marca como inicializado após ler o localStorage
    setIsInitialized(true);
  }, []); // ⚠️ CRITICAL: Rodar apenas UMA VEZ na montagem

  // ✅ FASE 2: Auto-selecionar primeira propriedade se não houver seleção
  useEffect(() => {
    // Só executar após properties carregarem E após inicialização
    if (propertiesLoading || !isInitialized) {
      return;
    }

    console.log('[SelectedPropertyProvider] Properties loaded:', properties.length);

    // Se não tem seleção mas tem propriedades, selecionar a primeira
    if (!selectedPropertyId && properties.length > 0) {
      const firstPropertyId = properties[0].id;
      console.log('[SelectedPropertyProvider] Auto-selecting first property:', firstPropertyId);
      setSelectedPropertyIdState(firstPropertyId);
      localStorage.setItem('selectedPropertyId', firstPropertyId);
    }

    // Se tem seleção mas a propriedade não existe mais, limpar
    if (selectedPropertyId && !properties.find(p => p.id === selectedPropertyId)) {
      console.warn('[SelectedPropertyProvider] Selected property not found, clearing selection');
      setSelectedPropertyIdState(null);
      localStorage.removeItem('selectedPropertyId');
    }

    // Marca loading como concluído
    console.log('[SelectedPropertyProvider] Phase 2 Done. Selection:', selectedPropertyId);
    setIsLoading(false);
  }, [properties, propertiesLoading, selectedPropertyId, isInitialized]);

  // ✅ Função para atualizar seleção (persiste no localStorage)
  const setSelectedPropertyId = (id: string | null) => {
    console.log('[SelectedPropertyProvider] User changed selection to:', id);
    setSelectedPropertyIdState(id);

    if (id) {
      localStorage.setItem('selectedPropertyId', id);
    } else {
      localStorage.removeItem('selectedPropertyId');
    }
  };

  const combinedLoading = isLoading || propertiesLoading;

  if (combinedLoading) {
    console.log('[SelectedPropertyProvider] combinedLoading is TRUE', {
      internalIsLoading: isLoading,
      propertiesLoading
    });
  }

  return (
    <SelectedPropertyContext.Provider value={{
      selectedPropertyId,
      setSelectedPropertyId,
      isLoading: combinedLoading,
      properties
    }}>
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