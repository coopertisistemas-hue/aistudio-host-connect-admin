import { CalendarIcon, DollarSign, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BookingResultsProps {
  availabilityResult: { available: boolean; remainingAvailableRooms?: number; message: string } | null;
  priceResult: { total_amount: number; price_per_night: number; number_of_nights: number } | null;
}

const BookingResults = ({ availabilityResult, priceResult }: BookingResultsProps) => {
  if (!availabilityResult) return null;

  return (
    <Card className={cn("p-6 space-y-4", availabilityResult.available ? "border-success" : "border-destructive")}>
      <CardHeader className="p-0">
        <CardTitle className="text-2xl">2. Resultado da Busca</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {availabilityResult.available ? (
          <div className="flex items-center gap-3 text-success">
            <Home className="h-5 w-5" />
            <p className="font-semibold">Disponível! {availabilityResult.remainingAvailableRooms} quartos restantes.</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-destructive">
            <Home className="h-5 w-5" />
            <p className="font-semibold">Indisponível. {availabilityResult.message}</p>
          </div>
        )}

        {priceResult && availabilityResult.available && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <p>Preço por noite: <span className="font-semibold">R$ {priceResult.price_per_night.toFixed(2)}</span></p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <p>Número de noites: <span className="font-semibold">{priceResult.number_of_nights}</span></p>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              <DollarSign className="h-5 w-5" />
              <p>Valor Total: <span className="text-success">R$ {priceResult.total_amount.toFixed(2)}</span></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingResults;