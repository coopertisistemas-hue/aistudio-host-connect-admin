import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SyncOtaInput {
  property_id: string;
  room_type_id: string;
  date: string; // YYYY-MM-DD
  price?: number;
  availability?: number;
  max_attempts?: number;
}

export interface OtaSyncResult {
  ota: 'booking_com' | 'airbnb' | 'expedia';
  status: 'success' | 'failed';
  code: string;
  message: string;
  retryable: boolean;
  attempts: number;
}

export interface SyncOtaResponse {
  contract_version: string;
  trace_id: string;
  idempotency_key: string;
  property_id: string;
  room_type_id: string;
  date: string;
  success: boolean;
  summary: {
    total: number;
    success: number;
    failed: number;
    retryable_failed: number;
  };
  results: OtaSyncResult[];
}

export const useOtaSync = () => {
  const syncInventory = useMutation<SyncOtaResponse, Error, SyncOtaInput>({
    mutationFn: async (data) => {
      const idempotencyKey = `${data.property_id}:${data.room_type_id}:${data.date}:${data.price ?? 'na'}:${data.availability ?? 'na'}`;

      const { data: response, error } = await supabase.functions.invoke('sync-ota-inventory', {
        body: data,
        headers: {
          'x-idempotency-key': idempotencyKey,
        },
      });

      if (error) throw error;
      return response as SyncOtaResponse;
    },
    onSuccess: (data) => {
      const { success, failed, retryable_failed } = data.summary;
      toast({
        title: data.success ? 'Sincronizacao concluida' : 'Sincronizacao concluida com falhas',
        description: `${success} OTAs OK, ${failed} falhas (${retryable_failed} retryable).`,
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro de sincronizacao OTA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    syncInventory,
  };
};
