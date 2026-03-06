import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AvailabilityCheckInput {
  property_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  total_guests: number;
}

interface AvailabilityCheckResponse {
  available: boolean;
  remainingAvailableRooms: number;
  message: string;
}

interface PriceCalculationInput {
  property_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  selected_services_ids?: string[];
}

interface PriceCalculationResponse {
  total_amount: number;
  price_per_night: number;
  number_of_nights: number;
}

interface CheckoutSessionInput {
  booking_id: string;
  total_amount: number;
  currency: string;
  guest_email: string;
  property_id: string; // Added property_id
  property_name: string;
  room_type_name: string;
  success_url: string;
  cancel_url: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface VerifyStripeSessionInput {
  session_id: string;
  booking_id: string;
}

interface VerifyStripeSessionResponse {
  success: boolean;
  booking?: unknown; // Adjust type as needed for the returned booking
  message?: string;
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

function buildPublicApiHeaders(scope: string): Record<string, string> {
  return {
    'x-api-version': PUBLIC_API_VERSION,
    'x-api-scope': scope,
    'x-client-id': getClientId(),
  };
}

function unwrapPublicApiResponse<T>(response: unknown): T {
  const envelope = response as PublicApiEnvelope<T>;

  if (envelope && typeof envelope === 'object') {
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }

  return response as T;
}

export const useBookingEngine = () => {

  const checkAvailability = useMutation<AvailabilityCheckResponse, Error, AvailabilityCheckInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('check-availability', {
        body: JSON.stringify(data),
        headers: buildPublicApiHeaders('public.booking.availability.read'),
      });

      if (error) throw error;
      return unwrapPublicApiResponse<AvailabilityCheckResponse>(response);
    },
    onError: (error) => {
      toast({
        title: "Erro de Disponibilidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculatePrice = useMutation<PriceCalculationResponse, Error, PriceCalculationInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('calculate-price', {
        body: JSON.stringify(data),
        headers: buildPublicApiHeaders('public.booking.pricing.read'),
      });

      if (error) throw error;
      return unwrapPublicApiResponse<PriceCalculationResponse>(response);
    },
    onError: (error) => {
      toast({
        title: "Erro de Cálculo de Preço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCheckoutSession = useMutation<CheckoutSessionResponse, Error, CheckoutSessionInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('create-checkout-session', {
        body: JSON.stringify(data),
      });

      if (error) throw error;
      return response as CheckoutSessionResponse;
    },
    onError: (error) => {
      toast({
        title: "Erro ao Iniciar Pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyStripeSession = useMutation<VerifyStripeSessionResponse, Error, VerifyStripeSessionInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('verify-stripe-session', {
        body: JSON.stringify(data),
      });

      if (error) throw error;
      return response as VerifyStripeSessionResponse;
    },
    onError: (error) => {
      toast({
        title: "Erro de Verificação de Pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    checkAvailability,
    calculatePrice,
    createCheckoutSession,
    verifyStripeSession,
  };
};
