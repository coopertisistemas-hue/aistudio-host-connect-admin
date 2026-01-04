import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useRooms, Room, RoomInput } from "@/hooks/useRooms"; // Import RoomInput
import { useBookings, Booking } from "@/hooks/useBookings";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useFrontDesk, RoomAllocation } from "@/hooks/useFrontDesk"; // Importar useFrontDesk
import { Loader2, Bed, CheckCircle2, XCircle, Wrench, Home, LogIn, LogOut, Clock, AlertTriangle, TrendingUp, BedDouble, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import FrontDeskRoomCard from "@/components/FrontDeskRoomCard";
import InvoiceDialog from "@/components/InvoiceDialog";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT

import { supabase } from "@/integrations/supabase/client"; // Import supabase
import { useOrg } from "@/hooks/useOrg"; // DEBUG IMPORT

const FrontDeskPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const { isLoading: orgLoading, currentOrgId } = useOrg(); // DEBUG HOOK
  const navigate = useNavigate();
  const { user } = useAuth(); // Import user to show ID

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

  const isLoading = frontDeskLoading;

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

  // DEBUG INFO COMPONENT
  const DebugInfo = () => (
    <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs font-mono text-muted-foreground text-left max-w-md mx-auto">
      <p className="font-bold text-foreground">DEBUG DIAGNOSTICS:</p>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <span>Org Loading:</span> <span className={orgLoading ? "text-yellow-600" : "text-green-600"}>{String(orgLoading)}</span>
        <span>Org ID:</span> <span>{currentOrgId || 'null'}</span>
        <span>Props Loading:</span> <span className={propertiesLoading ? "text-yellow-600" : "text-green-600"}>{String(propertiesLoading)}</span>
        <span>Props Count:</span> <span>{properties?.length || 0}</span>
        <span>FD Loading:</span> <span className={frontDeskLoading ? "text-yellow-600" : "text-green-600"}>{String(frontDeskLoading)}</span>
        <span>Selected Prop:</span> <span>{selectedPropertyId || 'null'}</span>
        <span>Allocated Rooms:</span> <span>{allocatedRooms?.length || 0}</span>
        <span className="col-span-2 mt-2 font-bold text-xs border-t pt-1">User Context:</span>
        <span className="col-span-2 text-[10px] break-all">{user?.id || 'No User'}</span>
        <span className="col-span-2 mt-1">Query: select * from organizations where owner_id = $UID</span>
      </div>
    </div>
  );

  if (propertiesLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Inicializando Front Desk...</p>
            <p className="text-sm text-muted-foreground">Carregando propriedades</p>
          </div>
          <DebugInfo />
        </div>
      </DashboardLayout>
    );
  }

  if (frontDeskLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Carregando Front Desk...</p>
            <p className="text-sm text-muted-foreground">Sincronizando status dos quartos</p>
          </div>
          <DebugInfo />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedPropertyId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in zoom-in duration-500">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Selecione uma Propriedade</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Escolha a propriedade que deseja gerenciar no Front Desk.
            </p>
          </div>
          <Button onClick={() => navigate('/properties')} size="lg" className="rounded-xl shadow-lg">
            <Building2 className="mr-2 h-5 w-5" />
            Ir para Propriedades
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Header Premium */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Front Desk Operacional</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Visão em tempo real do status dos quartos • {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[250px] h-11 rounded-xl font-semibold shadow-soft">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Selecione uma propriedade" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id} className="font-medium">
                  {prop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Taxa de Ocupação */}
          <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Taxa de Ocupação</p>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">
                    {allocatedRooms.length > 0
                      ? ((allocatedRooms.filter(r => r.status === 'occupied').length / allocatedRooms.length) * 100).toFixed(1)
                      : '0'}%
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                    {allocatedRooms.filter(r => r.status === 'occupied').length}/{allocatedRooms.length} quartos
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-ins Hoje */}
          <Card className="border-none bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Check-ins Hoje</p>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{checkInsToday.length}</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Reservas confirmadas</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                  <LogIn className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-outs Hoje */}
          <Card className="border-none bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Check-outs Hoje</p>
                  <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-1">{checkOutsToday.length}</p>
                  <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">Partidas previstas</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg">
                  <LogOut className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quartos Disponíveis */}
          <Card className="border-none bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Quartos Disponíveis</p>
                  <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">
                    {allocatedRooms.filter(r => r.status === 'available').length}
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">Prontos para ocupação</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
                  <BedDouble className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Status Grid (Kanban-like view) */}
        <Card className="border-none shadow-medium">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-xl font-bold">Mapa de Quartos</CardTitle>
                <CardDescription>Clique em um quarto para gerenciar status e operações</CardDescription>
              </div>

              {/* Legendas dos Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 rounded-full text-xs font-bold text-success border border-success/20">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  Disponível
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 rounded-full text-xs font-bold text-destructive border border-destructive/20">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  Ocupado
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Manutenção
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            ) : allocatedRooms.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <BedDouble className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum quarto cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Cadastre quartos para começar a gerenciar o Front Desk e realizar check-ins/check-outs.
                </p>
                <Button onClick={() => navigate('/rooms')} size="lg" className="rounded-xl">
                  <Building2 className="mr-2 h-5 w-5" />
                  Cadastrar Quartos
                </Button>
              </div>
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