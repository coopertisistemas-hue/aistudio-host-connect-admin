import { z } from "zod";

export const bookingEngineSchema = z.object({
  property_id: z.string().min(1, "Selecione uma propriedade."),
  room_type_id: z.string().min(1, "Selecione um tipo de acomodação."),
  check_in: z.date({ required_error: "Selecione a data de check-in." }),
  check_out: z.date({ required_error: "Selecione a data de check-out." }),
  total_guests: z.number().min(1, "Mínimo de 1 hóspede.").max(10, "Máximo de 10 hóspedes."), // Example max
  guest_name: z.string().min(1, "Nome completo é obrigatório."),
  guest_email: z.string().email("Email inválido.").min(1, "Email é obrigatório."),
  guest_phone: z.string().optional().nullable(),
  selected_services_ids: z.array(z.string()).optional().nullable(),
}).refine((data) => data.check_out > data.check_in, {
  message: "A data de check-out deve ser posterior à data de check-in.",
  path: ["check_out"],
});

export type BookingEngineInput = z.infer<typeof bookingEngineSchema>;