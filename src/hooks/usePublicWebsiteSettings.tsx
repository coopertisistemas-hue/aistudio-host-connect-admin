import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicWebsiteSettings {
  [key: string]: unknown;
}

type PublicApiEnvelope<T> = {
  contract_version?: string;
  trace_id?: string;
  code?: string;
  error?: string;
  data?: T;
};

const PUBLIC_API_VERSION = 'v1.0';

function getClientId(): string {
  const key = 'public-api-client-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  localStorage.setItem(key, generated);
  return generated;
}

export const usePublicWebsiteSettings = (propertyId: string) => {
  return useQuery<PublicWebsiteSettings, Error>({
    queryKey: ['publicWebsiteSettings', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-public-website-settings', {
        body: JSON.stringify({ property_id: propertyId }),
        headers: {
          'x-api-version': PUBLIC_API_VERSION,
          'x-api-scope': 'public.website.settings.read',
          'x-client-id': getClientId(),
        },
      });

      if (error) throw error;
      const envelope = data as PublicApiEnvelope<PublicWebsiteSettings>;
      if (envelope?.error) throw new Error(envelope.error);
      if (envelope?.data) return envelope.data;
      return data as PublicWebsiteSettings;
    },
    enabled: !!propertyId,
  });
};
