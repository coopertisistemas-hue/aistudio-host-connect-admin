import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { BookingEngineInput } from "@/lib/booking-engine-schemas";

interface GuestDetailsFormProps {
  form: UseFormReturn<BookingEngineInput>;
  onFinalSubmit: (data: BookingEngineInput) => void;
  isBooking: boolean;
  isFormValidForBooking: boolean;
}

const GuestDetailsForm = ({ form, onFinalSubmit, isBooking, isFormValidForBooking }: GuestDetailsFormProps) => {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <Card className="p-6 space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl">3. Seus Dados</CardTitle>
        <CardDescription>Preencha suas informações para finalizar a reserva.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guest_name">Nome Completo *</Label>
          <Input
            id="guest_name"
            placeholder="Seu nome completo"
            {...register("guest_name")}
            disabled={isBooking}
          />
          {errors.guest_name && <p className="text-destructive text-sm mt-1">{errors.guest_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest_email">Email *</Label>
          <Input
            id="guest_email"
            type="email"
            placeholder="seu@email.com"
            {...register("guest_email")}
            disabled={isBooking}
          />
          {errors.guest_email && <p className="text-destructive text-sm mt-1">{errors.guest_email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest_phone">Telefone (Opcional)</Label>
          <Input
            id="guest_phone"
            type="tel"
            placeholder="(XX) XXXXX-XXXX"
            {...register("guest_phone")}
            disabled={isBooking}
          />
          {errors.guest_phone && <p className="text-destructive text-sm mt-1">{errors.guest_phone.message}</p>}
        </div>

        <Button
          onClick={handleSubmit(onFinalSubmit)}
          disabled={!isFormValidForBooking || isBooking}
          className="w-full"
        >
          {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isBooking ? "Finalizando Reserva..." : "Finalizar Reserva e Pagar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GuestDetailsForm;