import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from "./useOrg"; // Multi-tenant context
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export const invoiceSchema = z.object({
  booking_id: z.string().min(1, "A reserva é obrigatória."),
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  issue_date: z.date().optional(),
  due_date: z.date().optional().nullable(),
  total_amount: z.number().min(0, "O valor total deve ser positivo."),
  paid_amount: z.number().min(0, "O valor pago não pode ser negativo.").optional(),
  status: z.enum(['pending', 'paid', 'partially_paid', 'cancelled']).default('pending'),
  payment_method: z.string().optional().nullable(),
  payment_intent_id: z.string().optional().nullable(),
});

export type Invoice = Tables<'invoices'> & {
  bookings?: {
    guest_name: string | null;
    guest_email: string | null;
  } | null;
};
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const useInvoices = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId, isLoading: isOrgLoading } = useOrg();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices', currentOrgId, propertyId],
    queryFn: async () => {
      if (!currentOrgId) {
        console.warn('[useInvoices] Abortando fetch: currentOrgId indefinido.');
        return [];
      }
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          bookings (
            guest_name,
            guest_email
          )
        `)
        .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !isOrgLoading && !!currentOrgId && !!propertyId,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: InvoiceInput) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...invoice,
          org_id: currentOrgId, // 🔐 ALWAYS include org_id
          issue_date: invoice.issue_date ? invoice.issue_date.toISOString() : undefined,
          due_date: invoice.due_date ? invoice.due_date.toISOString() : null,
        } as TablesInsert<'invoices'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Fatura criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating invoice:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar fatura: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, invoice }: { id: string; invoice: Partial<InvoiceInput> }) => {
      const updateData: any = { ...invoice };

      if (invoice.issue_date) {
        updateData.issue_date = invoice.issue_date.toISOString();
      }
      if (invoice.due_date) {
        updateData.due_date = invoice.due_date.toISOString();
      } else if (invoice.due_date === null) {
        updateData.due_date = null;
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', currentOrgId, propertyId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] }); // Invalidate bookings as status might change
      toast({
        title: "Sucesso!",
        description: "Fatura atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating invoice:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar fatura: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    invoices: invoices || [],
    isLoading,
    error,
    createInvoice,
    updateInvoice,
  };
};