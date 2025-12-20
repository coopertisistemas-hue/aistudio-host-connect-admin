import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types';

export const websiteSettingSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  setting_key: z.string().min(1, "A chave da configuração é obrigatória."),
  setting_value: z.any().optional().nullable(), // Can be any JSON structure
});

export type WebsiteSetting = {
  id: string;
  property_id: string;
  setting_key: string;
  setting_value: any | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteSettingInput = z.infer<typeof websiteSettingSchema>;

export const useWebsiteSettings = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['website_settings', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .eq('property_id', propertyId);

      if (error) throw error;
      return data as WebsiteSetting[];
    },
    enabled: !!propertyId,
  });

  const createSetting = useMutation({
    mutationFn: async (setting: WebsiteSettingInput) => {
      const { data, error } = await supabase
        .from('website_settings')
        .insert([setting as TablesInsert<'website_settings'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website_settings', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Configuração de site criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating website setting:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar configuração de site: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, setting }: { id: string; setting: Partial<WebsiteSettingInput> }) => {
      const { data, error } = await supabase
        .from('website_settings')
        .update(setting)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website_settings', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Configuração de site atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating website setting:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração de site: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('website_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website_settings', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Configuração de site removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting website setting:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover configuração de site: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings: settings || [],
    isLoading,
    error,
    createSetting,
    updateSetting,
    deleteSetting,
  };
};