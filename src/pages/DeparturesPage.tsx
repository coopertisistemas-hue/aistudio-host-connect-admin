import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useDepartures } from "@/hooks/useDepartures";
import { useFrontDesk } from "@/hooks/useFrontDesk";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, LogOut, Calendar, Building2, User, Home, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge } from "@/lib/ui-helpers";
import InvoiceDialog from "@/components/InvoiceDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DeparturesPage = () => {
    const { properties, isLoading: propertiesLoading } = useProperties();
    const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
    const { departures, isLoading: departuresLoading } = useDepartures(selectedPropertyId);
    const { checkOutStart, finalizeCheckOut } = useFrontDesk(selectedPropertyId);
    const { updateInvoice } = useInvoices(selectedPropertyId);
    const { toast } = useToast();

    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState<any>(null);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const isLoading = propertiesLoading || departuresLoading || propertyStateLoading;

    const handleCheckOut = async (departure: any) => {
        if (!departure.current_room_id) {
            toast({
                title: "Erro no Check-out",
                description: "Esta reserva não possui um quarto alocado.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessingPayment(true);
        try {
            const invoice = await checkOutStart(departure.id);
            if (invoice) {
                setCurrentBooking(departure);
                setCurrentInvoice(invoice as Invoice);
                setCurrentRoomId(departure.current_room_id);
                setInvoiceDialogOpen(true);
            }
        } catch (e) {
            // Handled in hook
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handlePaymentSuccess = async (invoiceId: string, amount: number) => {
        const { data: updatedInvoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (!updatedInvoice || !currentBooking || !currentRoomId) return;

        const totalDue = currentBooking.total_amount;
        const newPaidAmount = updatedInvoice.paid_amount || 0;

        if (newPaidAmount >= totalDue) {
            await finalizeCheckOut({ bookingId: currentBooking.id, roomId: currentRoomId });
            setInvoiceDialogOpen(false);
        } else {
            toast({
                title: "Pagamento Registrado",
                description: `R$ ${amount.toFixed(2)} registrado. Faltam R$ ${(totalDue - newPaidAmount).toFixed(2)}.`,
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
                            Selecione uma propriedade no menu para ver as partidas de hoje.
                        </p>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Partidas de Hoje</h1>
                        <p className="text-muted-foreground mt-1">
                            Lista de hóspedes com check-out previsto para hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}.
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
                                    {prop.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground mt-2">Carregando partidas...</p>
                        </div>
                    ) : departures.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Nenhuma partida para hoje</h3>
                                <p className="text-muted-foreground">Não há check-outs previstos para esta propriedade hoje.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        departures.map((departure) => (
                            <Card key={departure.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-destructive" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{departure.guest_name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        {getStatusBadge(departure.status as any)}
                                                        <span>•</span>
                                                        <span>Quarto: {departure.rooms?.room_number || 'Não alocado'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{departure.room_types?.name || 'Tipo não definido'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span>Check-in: {format(parseISO(departure.check_in), "dd/MM/yyyy")}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                                            <div className="text-right mb-2">
                                                <p className="text-sm text-muted-foreground">Valor Total</p>
                                                <p className="text-xl font-bold text-destructive">
                                                    R$ {departure.total_amount?.toFixed(2)}
                                                </p>
                                            </div>

                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleCheckOut(departure)}
                                                disabled={isProcessingPayment}
                                            >
                                                {isProcessingPayment ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                )}
                                                Realizar Check-out
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <InvoiceDialog
                open={invoiceDialogOpen}
                onOpenChange={setInvoiceDialogOpen}
                booking={currentBooking}
                invoice={currentInvoice}
                onPaymentSuccess={(invoiceId, amount, method) => {
                    updateInvoice.mutate({ id: invoiceId, invoice: {} }, {
                        onSuccess: () => {
                            handlePaymentSuccess(invoiceId, amount);
                        }
                    });
                }}
                isProcessingPayment={isProcessingPayment}
            />
        </DashboardLayout>
    );
};

export default DeparturesPage;
