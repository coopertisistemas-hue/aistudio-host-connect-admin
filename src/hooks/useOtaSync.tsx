import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncOtaInput {
  property_id: string;
  room_type_id: string;
  date: string; // YYYY-MM-DD
  price?: number;
  availability?: number;
}

interface SyncOtaResponse {
  success: boolean;
  results: Record<string, string>;
}

export const useOtaSync = () => {

  const syncInventory = useMutation<SyncOtaResponse, Error, SyncOtaInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('sync-ota-inventory', {
        body: JSON.stringify(data),
      });

      if (error) throw error;
      return response as SyncOtaResponse;
    },
    onSuccess: (data) => {
      console.log('OTA Sync Results:', data.results);
      toast({
        title: "Sincronização Iniciada",
        description: "O inventário e o preço foram enviados para as OTAs configuradas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro de Sincronização OTA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    syncInventory,
  };
};