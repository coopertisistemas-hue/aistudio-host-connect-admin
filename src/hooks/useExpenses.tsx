import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export const expenseSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  description: z.string().min(1, "A descrição da despesa é obrigatória."),
  amount: z.number().min(0.01, "O valor da despesa deve ser maior que zero."),
  expense_date: z.date({ required_error: "A data da despesa é obrigatória." }),
  category: z.string().optional().nullable(),
  payment_status: z.enum(['pending', 'paid', 'overdue']).default('pending'), // Novo campo
  paid_date: z.date().optional().nullable(), // Novo campo
});

export type Expense = Tables<'expenses'>;
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const useExpenses = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('property_id', propertyId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!propertyId,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: ExpenseInput) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          ...expense,
          expense_date: expense.expense_date.toISOString().split('T')[0],
          paid_date: expense.paid_date ? expense.paid_date.toISOString().split('T')[0] : null,
        } as TablesInsert<'expenses'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary', propertyId] }); // Invalidate financial summary
      toast({
        title: "Sucesso!",
        description: "Despesa criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar despesa: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, expense }: { id: string; expense: Partial<ExpenseInput> }) => {
      const updateData: any = { ...expense };
      if (expense.expense_date) {
        updateData.expense_date = expense.expense_date.toISOString().split('T')[0];
      }
      if (expense.paid_date) {
        updateData.paid_date = expense.paid_date.toISOString().split('T')[0];
      } else if (expense.paid_date === null) {
        updateData.paid_date = null;
      }

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary', propertyId] }); // Invalidate financial summary
      toast({
        title: "Sucesso!",
        description: "Despesa atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar despesa: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary', propertyId] }); // Invalidate financial summary
      toast({
        title: "Sucesso!",
        description: "Despesa removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover despesa: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    expenses: expenses || [],
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};