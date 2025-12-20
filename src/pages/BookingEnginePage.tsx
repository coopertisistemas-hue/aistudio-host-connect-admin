import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router-dom";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProperties } from "@/hooks/useProperties";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useServices } from "@/hooks/useServices";
import { useBookingEngine } from "@/hooks/useBookingEngine";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import BookingForm from "@/components/booking-engine/BookingForm";
import BookingResults from "@/components/booking-engine/BookingResults";
import GuestDetailsForm from "@/components/booking-engine/GuestDetailsForm";
import { bookingEngineSchema, BookingEngineInput } from "@/lib/booking-engine-schemas";

const BookingEnginePage = () => {
  const { toast } = useToast();
  const { propertyId: urlPropertyId } = useParams<{ propertyId?: string }>();
  const { properties } = useProperties();
  const { checkAvailability, calculatePrice, createCheckoutSession } = useBookingEngine();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(urlPropertyId);
  const { roomTypes } = useRoomTypes(selectedPropertyId);
  const { services } = useServices(selectedPropertyId);

  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const form = useForm<BookingEngineInput>({
    resolver: zodResolver(bookingEngineSchema),
    defaultValues: {
      property_id: urlPropertyId || "",
      room_type_id: "",
      check_in: new Date(),
      check_out: new Date(Date.now() + 86400000), // +1 day
      total_guests: 1,
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      selected_services_ids: [],
    },
  });

  const { watch, formState: { errors } } = form;
  const watchedFields = watch();

  // Reset availability and price results when relevant form fields change
  useEffect(() => {
    setAvailabilityResult(null);
    setPriceResult(null);
  }, [
    watchedFields.property_id,
    watchedFields.room_type_id,
    watchedFields.check_in,
    watchedFields.check_out,
    watchedFields.total_guests,
    watchedFields.selected_services_ids,
  ]);

  const handleCheckAvailabilityAndPrice = async (data: BookingEngineInput) => {
    setAvailabilityResult(null);
    setPriceResult(null);
    setIsChecking(true);
    try {
      const availabilityData = {
        property_id: data.property_id,
        room_type_id: data.room_type_id,
        check_in: format(data.check_in, 'yyyy-MM-dd'),
        check_out: format(data.check_out, 'yyyy-MM-dd'),
        total_guests: data.total_guests,
      };
      const availabilityResponse = await checkAvailability.mutateAsync(availabilityData);
      setAvailabilityResult(availabilityResponse);

      if (availabilityResponse.available) {
        setIsCalculating(true);
        const priceData = {
          property_id: data.property_id,
          room_type_id: data.room_type_id,
          check_in: format(data.check_in, 'yyyy-MM-dd'),
          check_out: format(data.check_out, 'yyyy-MM-dd'),
          total_guests: data.total_guests,
          selected_services_ids: data.selected_services_ids || [],
        };
        const priceResponse = await calculatePrice.mutateAsync(priceData);
        setPriceResult(priceResponse);
      }
    } catch (error) {
      console.error("Erro no processo de verificação/cálculo:", error);
      setAvailabilityResult({ available: false, message: "Erro ao verificar disponibilidade ou calcular preço." });
    } finally {
      setIsChecking(false);
      setIsCalculating(false);
    }
  };

  const handleFinalBooking = async (data: BookingEngineInput) => {
    if (!priceResult || !availabilityResult?.available) {
      toast({
        title: "Erro na Reserva",
        description: "Por favor, verifique a disponibilidade e o preço antes de prosseguir.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      const { data: newBooking, error: createBookingError } = await supabase
        .from('bookings')
        .insert([{
          property_id: data.property_id,
          room_type_id: data.room_type_id,
          guest_name: data.guest_name,
          guest_email: data.guest_email,
          guest_phone: data.guest_phone,
          check_in: format(data.check_in, 'yyyy-MM-dd'),
          check_out: format(data.check_out, 'yyyy-MM-dd'),
          total_guests: data.total_guests,
          total_amount: priceResult.total_amount,
          status: 'pending',
          notes: 'Reserva criada via motor de reservas.',
          services_json: data.selected_services_ids || [],
        }])
        .select()
        .single();

      if (createBookingError || !newBooking) {
        throw createBookingError || new Error("Falha ao criar a reserva no banco de dados.");
      }

      const selectedProperty = properties.find(p => p.id === data.property_id);
      const selectedRoomType = roomTypes.find(rt => rt.id === data.room_type_id);

      if (!selectedProperty || !selectedRoomType) {
        throw new Error("Propriedade ou tipo de acomodação não encontrados.");
      }

      const checkoutSessionData = {
        booking_id: newBooking.id,
        total_amount: priceResult.total_amount,
        currency: 'BRL',
        guest_email: data.guest_email,
        property_id: data.property_id, // Added property_id
        property_name: selectedProperty.name,
        room_type_name: selectedRoomType.name,
        success_url: `${window.location.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${newBooking.id}`,
        cancel_url: `${window.location.origin}/booking-cancel?booking_id=${newBooking.id}`,
      };

      const session = await createCheckoutSession.mutateAsync(checkoutSessionData);
      
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Falha ao obter URL de checkout do Stripe.");
      }

    } catch (error: any) {
      console.error("Erro ao finalizar reserva:", error);
      toast({
        title: "Erro na Reserva",
        description: error.message || "Não foi possível finalizar sua reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const isFormValidForBooking = watchedFields.property_id && watchedFields.room_type_id && watchedFields.check_in && watchedFields.check_out && watchedFields.total_guests > 0 && watchedFields.guest_name && watchedFields.guest_email && priceResult?.total_amount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Motor de Reservas</h1>
            <p className="text-muted-foreground text-lg">
              Encontre e reserve sua acomodação perfeita
            </p>
          </div>

          <BookingForm
            form={form}
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            onSubmit={handleCheckAvailabilityAndPrice}
            isChecking={isChecking}
            isCalculating={isCalculating}
            isBooking={isBooking}
            urlPropertyId={urlPropertyId}
          />

          <BookingResults
            availabilityResult={availabilityResult}
            priceResult={priceResult}
          />

          {availabilityResult?.available && priceResult && (
            <GuestDetailsForm
              form={form}
              onFinalSubmit={handleFinalBooking}
              isBooking={isBooking}
              isFormValidForBooking={isFormValidForBooking}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingEnginePage;