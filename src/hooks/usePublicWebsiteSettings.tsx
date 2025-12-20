import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicWebsiteSettings {
  [key: string]: any;
}

export const usePublicWebsiteSettings = (propertyId: string) => {
  return useQuery<PublicWebsiteSettings, Error>({
    queryKey: ['publicWebsiteSettings', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-public-website-settings', {
        body: JSON.stringify({ property_id: propertyId }),
      });

      if (error) throw error;
      return data as PublicWebsiteSettings;
    },
    enabled: !!propertyId,
  });
};