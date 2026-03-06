import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from './useOrg';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { BookingStatus, canTransitionBookingStatus, toCanonicalBookingStatus } from '@/lib/constants/statuses';

interface UpdateBookingStatusParams {
  bookingId: string;
  newStatus: BookingStatus;
  propertyId?: string;
}

export const useUpdateBookingStatus = () => {
  const { currentOrgId } = useOrg();
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, newStatus }: UpdateBookingStatusParams) => {
      if (userRole === 'viewer') {
        throw new Error('VIEWER_BLOCKED');
      }

      if (!currentOrgId) {
        throw new Error('NO_ORG_CONTEXT');
      }

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, org_id, status')
        .eq('id', bookingId)
        .eq('org_id', currentOrgId)
        .single();

      if (fetchError || !booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      const currentStatus = toCanonicalBookingStatus(booking.status);
      const targetStatus = toCanonicalBookingStatus(newStatus);

      if (!canTransitionBookingStatus(currentStatus, targetStatus)) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .eq('org_id', currentOrgId)
        .select()
        .single();

      if (error) {
        throw new Error('UPDATE_FAILED');
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['frontdesk-arrivals'] });
      queryClient.invalidateQueries({ queryKey: ['frontdesk-departures'] });
      queryClient.invalidateQueries({ queryKey: ['frontdesk-inhouse'] });
      queryClient.invalidateQueries({ queryKey: ['booking-folio', currentOrgId, variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      toast({
        title: 'Status atualizado',
        description: 'O status da reserva foi alterado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      const errorMessages: Record<string, { title: string; description: string }> = {
        VIEWER_BLOCKED: {
          title: 'Acao nao permitida',
          description: 'Usuarios com perfil de visualizacao nao podem alterar status.',
        },
        NO_ORG_CONTEXT: {
          title: 'Erro de contexto',
          description: 'Organizacao nao identificada. Recarregue a pagina.',
        },
        BOOKING_NOT_FOUND: {
          title: 'Reserva nao encontrada',
          description: 'A reserva nao existe ou voce nao tem permissao para acessa-la.',
        },
        UPDATE_FAILED: {
          title: 'Falha na atualizacao',
          description: 'Nao foi possivel atualizar o status. Tente novamente.',
        },
        INVALID_STATUS_TRANSITION: {
          title: 'Transicao invalida',
          description: 'A mudanca de status solicitada nao e permitida no fluxo da reserva.',
        },
      };

      const errorMessage = errorMessages[error.message] || {
        title: 'Erro desconhecido',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
      };

      toast({
        title: errorMessage.title,
        description: errorMessage.description,
        variant: 'destructive',
      });
    },
  });
};
