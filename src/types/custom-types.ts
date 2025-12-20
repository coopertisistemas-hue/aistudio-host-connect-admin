import { Tables } from "@/integrations/supabase/types";

// Exemplo de como estender ou usar os tipos gerados
export type CustomBooking = Tables<'bookings'> & {
  propertyName: string; // Adicione campos que vêm de joins ou são calculados
};

export type CustomProfile = Tables<'profiles'> & {
  isAdmin: boolean; // Exemplo de campo calculado ou de lógica de negócio
};

// Você pode criar tipos para cada tabela para facilitar o uso
export type Amenity = Tables<'amenities'>;
export type Property = Tables<'properties'>;
export type RoomType = Tables<'room_types'>;
export type Room = Tables<'rooms'>;
export type PricingRule = Tables<'pricing_rules'>;