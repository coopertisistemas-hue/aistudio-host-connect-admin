import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface EntityPhoto {
  id: string;
  entity_id: string;
  photo_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useEntityPhotos = (entityId?: string) => {
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useQuery({
    queryKey: ['entity-photos', entityId],
    queryFn: async () => {
      if (!entityId) return [];
      
      const { data, error } = await supabase
        .from('entity_photos') // Updated table name
        .select('*')
        .eq('entity_id', entityId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as EntityPhoto[];
    },
    enabled: !!entityId,
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ file, entityId }: { file: File; entityId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${entityId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('entity_photos') // Updated table name
        .insert([{
          entity_id: entityId,
          photo_url: publicUrl,
          display_order: photos?.length || 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-photos'] });
      toast({
        title: "Sucesso!",
        description: "Foto adicionada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const photo = photos?.find(p => p.id === photoId);
      if (!photo) throw new Error('Photo not found');

      // Extract file path from URL
      const urlParts = photo.photo_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('property-photos') + 1).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-photos')
        .remove([filePath]);

      if (storageError) console.error('Storage deletion error:', storageError);

      // Delete from database
      const { error } = await supabase
        .from('entity_photos') // Updated table name
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-photos'] });
      toast({
        title: "Sucesso!",
        description: "Foto removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover foto: " + error.message,
        variant: "destructive",
      });
    },
  });

  const setPrimaryPhoto = useMutation({
    mutationFn: async (photoId: string) => {
      if (!entityId) throw new Error('Entity ID is required');

      // Remove primary flag from all photos for this entity
      await supabase
        .from('entity_photos') // Updated table name
        .update({ is_primary: false })
        .eq('entity_id', entityId);

      // Set new primary photo
      const { error } = await supabase
        .from('entity_photos') // Updated table name
        .update({ is_primary: true })
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-photos'] });
      toast({
        title: "Sucesso!",
        description: "Foto principal definida.",
      });
    },
    onError: (error: Error) => {
      console.error('Error setting primary photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao definir foto principal: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    photos: photos || [],
    isLoading,
    uploadPhoto,
    deletePhoto,
    setPrimaryPhoto,
  };
};