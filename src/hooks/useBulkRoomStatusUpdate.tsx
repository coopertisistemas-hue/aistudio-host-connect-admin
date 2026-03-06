import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type BulkRoomStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'dirty'
  | 'cleaning'
  | 'clean'
  | 'inspected'
  | 'out_of_order';

interface BulkRoomStatusParams {
  roomIds: string[];
  propertyId: string;
  newStatus: BulkRoomStatus;
}

export const useBulkRoomStatusUpdate = () => {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrg();
  const { userRole } = useAuth();
  const { toast } = useToast();

  const isViewer = userRole === 'viewer';

  return useMutation({
    mutationFn: async ({ roomIds, propertyId, newStatus }: BulkRoomStatusParams) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId) throw new Error('ORG_CONTEXT_REQUIRED');
      if (!propertyId) throw new Error('PROPERTY_CONTEXT_REQUIRED');
      if (!roomIds.length) throw new Error('ROOM_IDS_REQUIRED');

      const { data: existingRooms, error: fetchError } = await supabase
        .from('rooms')
        .select('id')
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId)
        .in('id', roomIds);

      if (fetchError) throw fetchError;

      if (!existingRooms || existingRooms.length !== roomIds.length) {
        throw new Error('ROOM_SCOPE_VALIDATION_FAILED');
      }

      const { error: updateError } = await supabase
        .from('rooms')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId)
        .in('id', roomIds);

      if (updateError) throw updateError;

      return { updatedCount: roomIds.length };
    },
    onSuccess: ({ updatedCount }, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, variables.propertyId] });
      toast({
        title: 'Atualizacao em lote concluida',
        description: `${updatedCount} quarto(s) atualizados para ${variables.newStatus}.`,
      });
    },
    onError: (error: Error) => {
      const map: Record<string, string> = {
        VIEWER_BLOCKED: 'Usuarios visualizadores nao podem alterar status de quartos.',
        ORG_CONTEXT_REQUIRED: 'Contexto de organizacao indisponivel.',
        PROPERTY_CONTEXT_REQUIRED: 'Selecione uma propriedade.',
        ROOM_IDS_REQUIRED: 'Selecione ao menos um quarto.',
        ROOM_SCOPE_VALIDATION_FAILED: 'Um ou mais quartos estao fora do escopo da propriedade selecionada.',
      };
      toast({ title: 'Erro', description: map[error.message] || error.message, variant: 'destructive' });
    },
  });
};

