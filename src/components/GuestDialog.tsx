import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Guest } from "@/hooks/useGuests";
import { Mail, Phone, Calendar, DollarSign, Home } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BookingHistoryItem from "@/components/BookingHistoryItem"; // Importando o novo componente

interface GuestDialogProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GuestDialog = ({ guest, open, onOpenChange }: GuestDialogProps) => {
  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{guest.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Informações de Contato</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{guest.email}</span>
              </div>
              {guest.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{guest.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Reservas</span>
              </div>
              <p className="text-2xl font-bold">{guest.totalBookings}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Gasto</span>
              </div>
              <p className="text-2xl font-bold">
                R$ {guest.totalSpent.toFixed(2)}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Última Visita</span>
              </div>
              <p className="text-sm font-semibold">
                {format(new Date(guest.lastVisit), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </Card>
          </div>

          {/* Booking History */}
          <div>
            <h3 className="font-semibold mb-3">Histórico de Reservas</h3>
            <div className="space-y-3">
              {guest.bookings.map((booking) => (
                <BookingHistoryItem key={booking.id} booking={booking} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestDialog;