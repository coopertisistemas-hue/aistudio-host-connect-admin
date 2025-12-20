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
  booking?: any; // Adjust type as needed for the returned booking
  message?: string;
}

export const useBookingEngine = () => {

  const checkAvailability = useMutation<AvailabilityCheckResponse, Error, AvailabilityCheckInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('check-availability', {
        body: JSON.stringify(data),
      });

      if (error) throw error;
      return response as AvailabilityCheckResponse;
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
      });

      if (error) throw error;
      return response as PriceCalculationResponse;
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