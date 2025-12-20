import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Home } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Guest } from "@/hooks/useGuests"; // Importando Guest para tipagem

interface BookingHistoryItemProps {
  booking: Guest['bookings'][0]; // Tipo de uma única reserva do histórico do hóspede
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    confirmed: { label: "Confirmada", variant: "default" as const },
    pending: { label: "Pendente", variant: "secondary" as const },
    cancelled: { label: "Cancelada", variant: "destructive" as const },
    completed: { label: "Concluída", variant: "outline" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const BookingHistoryItem = ({ booking }: BookingHistoryItemProps) => {
  return (
    <Card className="p-4 hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            {booking.property}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(booking.checkIn), "dd/MM/yyyy", { locale: ptBR })} -{" "}
            {format(new Date(booking.checkOut), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        {getStatusBadge(booking.status)}
      </div>
      <p className="text-sm font-semibold flex items-center gap-2 mt-3">
        <DollarSign className="h-4 w-4 text-success" />
        R$ {booking.amount.toFixed(2)}
      </p>
    </Card>
  );
};

export default BookingHistoryItem;