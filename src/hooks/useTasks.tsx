import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useNotifications } from './useNotifications'; // Import useNotifications

export const taskSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  title: z.string().min(1, "O título da tarefa é obrigatório."),
  description: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  due_date: z.date().optional().nullable(),
  assigned_to: z.string().optional().nullable(), // User ID
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export type Task = Tables<'tasks'> & {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  profiles?: { full_name: string | null } | null;
};
export type TaskInput = z.infer<typeof taskSchema>;

export const useTasks = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications(); // Use the notification hook

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!propertyId,
  });

  const createTask = useMutation({
    mutationFn: async (task: TaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          due_date: task.due_date ? task.due_date.toISOString().split('T')[0] : null,
        } as TablesInsert<'tasks'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Tarefa criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: Partial<TaskInput> }) => {
      const updateData: any = { ...task };
      if (task.due_date) {
        updateData.due_date = task.due_date.toISOString().split('T')[0];
      } else if (task.due_date === null) {
        updateData.due_date = null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Tarefa atualizada com sucesso.",
      });

      const targetUserId = updatedTask.assigned_to;
      let ownerId = targetUserId;
      let propertyName = 'uma propriedade';

      if (!targetUserId) {
        // If not assigned to a specific user, notify the property owner
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('user_id, name')
          .eq('id', updatedTask.property_id)
          .single();

        if (propertyError) {
          console.error('Error fetching property owner for task notification:', propertyError);
          return;
        }
        ownerId = propertyData?.user_id;
        propertyName = propertyData?.name || propertyName;
      }

      if (ownerId) {
        createNotification.mutate({
          type: 'task_update',
          message: `Tarefa "${updatedTask.title}" (${propertyName}) atualizada para status: ${updatedTask.status}.`,
          userId: ownerId,
          is_read: false, // Added is_read
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Tarefa removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover tarefa: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
};