import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useFrontDesk } from "@/hooks/useFrontDesk";
import { RoomInput } from "@/hooks/useRooms";
import { Booking } from "@/hooks/useBookings";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import {
  Loader2,
  BedDouble,
  Home,
  LogIn,
  LogOut,
  TrendingUp,
  Building2,
  Monitor
} from "lucide-react";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import FrontDeskRoomCard from "@/components/FrontDeskRoomCard";
import InvoiceDialog from "@/components/InvoiceDialog";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { supabase } from "@/integrations/supabase/client";

const FrontDeskPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId } = useSelectedProperty();
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

  const { updateInvoice } = useInvoices(selectedPropertyId);
  const { toast } = useToast();

  // Estados para o modal de Fatura
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [currentBookingForInvoice, setCurrentBookingForInvoice] = useState<Booking | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Reservas de Check-in e Check-out de hoje
  const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const checkInsToday = propertyBookings.filter(b => format(parseISO(b.check_in), 'yyyy-MM-dd') === todayKey && b.status === 'confirmed');
  const checkOutsToday = propertyBookings.filter(b => format(parseISO(b.check_out), 'yyyy-MM-dd') === todayKey && b.status === 'confirmed');

  const handleRoomStatusChange = async (roomId: string, newStatus: RoomInput['status']) => {
    await updateRoomStatus({ id: roomId, room: { status: newStatus } });
  };

  const handleCheckIn = async (bookingId: string, roomId: string) => {
    await checkIn({ bookingId, roomId });
  };

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    const booking = propertyBookings.find(b => b.id === bookingId);
    if (booking && booking.total_amount > 0) {
      navigate(`/operation/folio/${bookingId}`);
      return;
    }

    setIsProcessingPayment(true);
    try {
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
      await finalizeCheckOut({ bookingId: booking.id, roomId });
    } else {
      toast({
        title: "Pagamento Registrado",
        description: `R$ ${amount.toFixed(2)} registrado. Restante: R$ ${(totalDue - newPaidAmount).toFixed(2)}.`,
      });
    }
  };

  if (propertiesLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Inicializando Front Desk...</p>
            <p className="text-sm text-muted-foreground">Carregando propriedades</p>
          </div>
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
      <div className="space-y-8 animate-in fade-in duration-700 pb-10">
        {/* 1. Header Premium */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Front Desk</h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Operação em tempo real • {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[280px] h-12 rounded-xl font-semibold shadow-sm border-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Selecione uma propriedade" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id} className="font-medium rounded-lg">
                    {prop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2. KPIs com Profundidade Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">

          {/* Taxa de Ocupação - Blue */}
          <Card className="border-none bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Ocupação
                    </p>
                  </div>
                  <p className="text-4xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                    {allocatedRooms.length > 0
                      ? ((allocatedRooms.filter(r => r.status === 'occupied').length / allocatedRooms.length) * 100).toFixed(0)
                      : '0'}%
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                    {allocatedRooms.filter(r => r.status === 'occupied').length} de {allocatedRooms.length} quartos
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <TrendingUp className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-ins Hoje - Green */}
          <Card className="border-none bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Check-ins Hoje
                    </p>
                  </div>
                  <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                    {checkInsToday.length}
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                    Reservas confirmadas
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <LogIn className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-outs Hoje - Rose */}
          <Card className="border-none bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Check-outs Hoje
                    </p>
                  </div>
                  <p className="text-4xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                    {checkOutsToday.length}
                  </p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
                    Partidas previstas
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <LogOut className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disponíveis - Amber */}
          <Card className="border-none bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Disponíveis
                    </p>
                  </div>
                  <p className="text-4xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
                    {allocatedRooms.filter(r => r.status === 'available').length}
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                    Prontos para ocupação
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <BedDouble className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Card de Mapa com Visual Refinado */}
        <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-card">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BedDouble className="h-4 w-4 text-primary" />
                  </div>
                  Mapa de Quartos
                </CardTitle>
                <CardDescription className="text-sm">
                  Clique em um quarto para gerenciar status e operações
                </CardDescription>
              </div>

              {/* Legendas com visual premium */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full text-xs font-bold text-success border border-success/20 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-success shadow-sm" />
                  Disponível
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-full text-xs font-bold text-destructive border border-destructive/20 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive shadow-sm" />
                  Ocupado
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                  Manutenção
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {allocatedRooms.length === 0 ? (
              // 3. Empty State Premium
              <div className="relative py-20 text-center border-2 border-dashed rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-background overflow-hidden">
                {/* Background Pattern Sutil */}
                <div className="absolute inset-0 opacity-[0.03]">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '48px 48px'
                  }} />
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Conteúdo existente do empty state */}
                  <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                    <BedDouble className="h-10 w-10 text-primary" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-xl font-bold">Configure suas Acomodações</h3>
                    <p className="text-sm text-muted-foreground">
                      Cadastre os quartos da sua propriedade para começar a gerenciar
                      reservas, check-ins e toda a operação do Front Desk.
                    </p>
                  </div>

                  <Button onClick={() => navigate('/rooms')} size="lg" className="rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <Building2 className="mr-2 h-5 w-5" />
                    Cadastrar Quartos
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4">
                    💡 Dica: Crie primeiro as Categorias de Quarto em Configuração → Categorias
                  </p>
                </div>
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

        {/* Invoice/Payment Dialog */}
        <InvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          booking={currentBookingForInvoice}
          invoice={currentInvoice}
          onPaymentSuccess={(invoiceId, amount, method) => {
            updateInvoice.mutate({ id: invoiceId, invoice: {} }, {
              onSuccess: () => {
                handlePaymentSuccess(invoiceId, amount, method);
              }
            });
          }}
          isProcessingPayment={isProcessingPayment}
        />
      </div>
    </DashboardLayout>
  );
};

export default FrontDeskPage;