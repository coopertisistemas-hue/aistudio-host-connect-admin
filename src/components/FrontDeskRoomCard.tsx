import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Room } from "@/hooks/useRooms";
import { Booking } from "@/hooks/useBookings";
import { Bed, CheckCircle2, XCircle, Wrench, LogIn, LogOut, Clock, Users, DollarSign, MoreVertical, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RoomAllocation } from "@/hooks/useFrontDesk";

interface FrontDeskRoomCardProps {
  room: RoomAllocation; // Use RoomAllocation type
  currentBooking: Booking | undefined; // Can be undefined
  checkInToday: Booking | undefined; // Can be undefined
  checkOutToday: Booking | undefined; // Can be undefined
  onStatusChange: (roomId: string, newStatus: Room['status']) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

const getStatusConfig = (status: Room['status']) => {
  switch (status) {
    case 'available':
      return { label: 'Disponível', color: 'border-success bg-success/10 text-success', icon: CheckCircle2 };
    case 'occupied':
      return { label: 'Ocupado', color: 'border-destructive bg-destructive/10 text-destructive', icon: LogIn };
    case 'maintenance':
      return { label: 'Manutenção', color: 'border-primary bg-primary/10 text-primary', icon: Wrench };
    default:
      return { label: 'Indefinido', color: 'border-muted bg-muted text-muted-foreground', icon: Clock };
  }
};

const FrontDeskRoomCard = ({ room, currentBooking, checkInToday, checkOutToday, onStatusChange, onCheckIn, onCheckOut }: FrontDeskRoomCardProps) => {
  const statusConfig = getStatusConfig(room.status);

  const handleAction = (action: Room['status']) => {
    onStatusChange(room.id, action);
  };

  // Determine the primary action button based on room status and daily events
  let primaryAction = null;
  
  if (room.status === 'available' && checkInToday) {
    // Room is available and there is a booking of this type checking in today
    primaryAction = {
      label: 'Check-in',
      icon: LogIn,
      onClick: onCheckIn,
      variant: "hero" as const,
      disabled: false,
    };
  } else if (room.status === 'occupied' && checkOutToday) {
    // Room is occupied and the current booking is checking out today
    primaryAction = {
      label: 'Check-out & Pagar',
      icon: LogOut,
      onClick: onCheckOut,
      variant: "destructive" as const,
      disabled: false,
    };
  } else if (room.status === 'maintenance') {
    primaryAction = {
      label: 'Liberar Manutenção',
      icon: CheckCircle2,
      onClick: () => handleAction('available'),
      variant: "success" as const,
      disabled: false,
    };
  } else {
    primaryAction = {
      label: 'Nenhuma Ação Diária',
      icon: Clock,
      onClick: () => {},
      variant: "outline" as const,
      disabled: true,
    };
  }

  // Determine which booking details to show
  const bookingToShow = currentBooking || checkInToday || checkOutToday;
  
  // Check for conflicts (e.g., room occupied but no active booking allocated)
  const isConflict = room.status === 'occupied' && !currentBooking;

  return (
    <Card className={cn("border-l-4 transition-all hover:shadow-medium", statusConfig.color)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bed className="h-5 w-5" />
            {room.room_number}
          </CardTitle>
          <Badge variant="secondary" className={cn("text-xs", statusConfig.color.split(' ')[0])}>
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription className="text-sm flex items-center gap-1">
          <span className="font-medium text-foreground/80">{room.room_types?.name || 'N/A'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Booking Info */}
        {isConflict && (
          <div className="space-y-2 p-2 bg-destructive/10 rounded-md border border-destructive">
            <p className="font-semibold text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Conflito: Ocupado sem Reserva Alocada
            </p>
          </div>
        )}

        {bookingToShow ? (
          <div className="space-y-2 p-2 bg-card rounded-md border">
            <p className="font-semibold text-sm truncate">{bookingToShow.guest_name}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <LogIn className="h-3 w-3" />
                {format(parseISO(bookingToShow.check_in), 'dd/MM')}
              </span>
              <span className="flex items-center gap-1">
                <LogOut className="h-3 w-3" />
                {format(parseISO(bookingToShow.check_out), 'dd/MM')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {bookingToShow.total_guests} hóspedes
              </span>
              <span className="flex items-center gap-1 text-success font-medium">
                <DollarSign className="h-3 w-3" />
                R$ {bookingToShow.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            {room.status === 'maintenance' ? 'Quarto em manutenção.' : 'Quarto livre e disponível.'}
          </p>
        )}

        {/* Daily Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1" 
            variant={primaryAction.variant} 
            onClick={primaryAction.onClick} 
            disabled={primaryAction.disabled || isConflict}
          >
            <primaryAction.icon className="h-4 w-4 mr-2" /> 
            {primaryAction.label}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log('View Room Details')}>
                Ver Detalhes do Quarto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction('available')} disabled={room.status === 'available'}>
                Marcar como Disponível
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction('occupied')} disabled={room.status === 'occupied'}>
                Marcar como Ocupado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction('maintenance')} disabled={room.status === 'maintenance'}>
                Marcar para Manutenção
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default FrontDeskRoomCard;