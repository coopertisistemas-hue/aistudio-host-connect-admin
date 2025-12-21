import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useRooms, Room, RoomInput } from "@/hooks/useRooms"; // Import RoomInput
import { useBookings, Booking } from "@/hooks/useBookings";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useFrontDesk, RoomAllocation } from "@/hooks/useFrontDesk"; // Importar useFrontDesk
import { Loader2, Bed, CheckCircle2, XCircle, Wrench, Home, LogIn, LogOut, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import FrontDeskRoomCard from "@/components/FrontDeskRoomCard";
import InvoiceDialog from "@/components/InvoiceDialog";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT
import { supabase } from "@/integrations/supabase/client"; // Import supabase

const FrontDeskPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const navigate = useNavigate();

  const {
    allocatedRooms,
    isLoading: frontDeskLoading,
    checkIn,
    checkOutStart,
    finalizeCheckOut,
    updateRoomStatus,
    propertyBookings,
  } = useFrontDesk(selectedPropertyId);

  const { invoices, isLoading: invoicesLoading, updateInvoice } = useInvoices(selectedPropertyId);
  const { toast } = useToast();

  // Estados para o modal de Fatura
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [currentBookingForInvoice, setCurrentBookingForInvoice] = useState<Booking | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null); // Armazena o roomId para finalizar o checkout
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isLoading = propertiesLoading || frontDeskLoading || invoicesLoading || propertyStateLoading;

  // Reservas de Check-in e Check-out de hoje
  const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const checkInsToday = propertyBookings.filter(b => format(parseISO(b.check_in), 'yyyy-MM-dd') === todayKey && b.status === 'confirmed');
  const checkOutsToday = propertyBookings.filter(b => format(parseISO(b.check_out), 'yyyy-MM-dd') === todayKey && b.status === 'confirmed');

  const handleRoomStatusChange = async (roomId: string, newStatus: RoomInput['status']) => { // Changed newStatus type
    await updateRoomStatus({ id: roomId, room: { status: newStatus } }); // No need for explicit cast here if newStatus is already typed correctly
  };

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    await checkIn({ bookingId, roomId });
  };

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    const booking = propertyBookings.find(b => b.id === bookingId);
    if (booking && booking.total_amount > 0) {
      // For Sprint 1.6, we redirect to Folio for ALL checkouts that have financial value
      // This ensures the receptionist reviews the granular folio items
      navigate(`/operation/folio/${bookingId}`);
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Fallback for zero-amount or legacy
      const invoice = await checkOutStart(bookingId);
      const booking = propertyBookings.find(b => b.id === bookingId);

      if (invoice && booking) {
        setCurrentBookingForInvoice(booking);
        setCurrentInvoice(invoice as Invoice);
        setCurrentRoomId(roomId);
        setInvoiceDialogOpen(true);
      }
    } catch (e) {
      // Erro já tratado no hook
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (invoiceId: string, amount: number, method: string) => {
    // Re-fetch the invoice data to ensure we have the latest paid amount
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!updatedInvoice) return;

    const booking = currentBookingForInvoice;
    const roomId = currentRoomId;

    if (!booking || !roomId) return;

    const totalDue = booking.total_amount;
    const newPaidAmount = updatedInvoice.paid_amount || 0;

    if (newPaidAmount >= totalDue) {
      // Finalize Check-out (Update Booking Status to 'completed' and Room Status to 'available')
      await finalizeCheckOut({ bookingId: booking.id, roomId });
    } else {
      toast({
        title: "Pagamento Registrado",
        description: `R$ ${amount.toFixed(2)} registrado. Restante: R$ ${(totalDue - newPaidAmount).toFixed(2)}.`,
      });
    }
  };

  if (propertyStateLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedPropertyId) {
    return (
      <DashboardLayout>
        <Card className="border-dashed mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Selecione uma propriedade no menu de Propriedades para começar a gerenciar o Front Desk.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header and Property Selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Front Desk Operacional</h1>
            <p className="text-muted-foreground mt-1">
              Visão em tempo real do status dos quartos e operações diárias.
            </p>
          </div>
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            disabled={propertiesLoading || properties.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Selecione uma propriedade" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name} ({prop.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Daily Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-primary">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Check-ins Hoje
            </CardTitle>
            <p className="text-2xl font-bold mt-1">{checkInsToday.length}</p>
            <CardDescription>{checkInsToday.length} reservas confirmadas.</CardDescription>
          </Card>
          <Card className="p-4 border-l-4 border-destructive">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Check-outs Hoje
            </CardTitle>
            <p className="text-2xl font-bold mt-1">{checkOutsToday.length}</p>
            <CardDescription>{checkOutsToday.length} reservas de saída.</CardDescription>
          </Card>
          <Card className="p-4 border-l-4 border-success">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bed className="h-4 w-4" /> Quartos Disponíveis
            </CardTitle>
            <p className="text-2xl font-bold mt-1">{allocatedRooms.filter(r => r.status === 'available').length}</p>
            <CardDescription>{allocatedRooms.length} quartos no total.</CardDescription>
          </Card>
        </div>

        {/* Room Status Grid (Kanban-like view) */}
        <Card>
          <CardHeader>
            <CardTitle>Quadro de Status dos Quartos</CardTitle>
            <CardDescription>Clique em um quarto para gerenciar o status e a reserva.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            ) : allocatedRooms.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum quarto cadastrado para esta propriedade. Cadastre em 'Quartos'.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allocatedRooms.map(room => (
                  <FrontDeskRoomCard
                    key={room.id}
                    room={room}
                    currentBooking={room.current_booking as Booking | undefined}
                    checkInToday={room.check_in_today as Booking | undefined}
                    checkOutToday={room.check_out_today as Booking | undefined}
                    onStatusChange={handleRoomStatusChange}
                    onCheckIn={() => handleCheckIn(room.check_in_today!.id, room.id)}
                    onCheckOut={() => handleCheckOut(room.check_out_today!.id, room.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice/Payment Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        booking={currentBookingForInvoice}
        invoice={currentInvoice}
        onPaymentSuccess={(invoiceId, amount, method) => {
          // Invalidate invoices to get the latest paid amount
          updateInvoice.mutate({ id: invoiceId, invoice: {} }, { // Empty update to trigger invalidation
            onSuccess: () => {
              handlePaymentSuccess(invoiceId, amount, method);
            }
          });
        }}
        isProcessingPayment={isProcessingPayment}
      />
    </DashboardLayout>
  );
};

export default FrontDeskPage;