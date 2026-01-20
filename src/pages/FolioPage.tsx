import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityDetailTemplate } from "@/components/EntityDetailTemplate";
import { useFolio } from "@/hooks/useFolio";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Receipt,
    Plus,
    DollarSign,
    Download,
    History,
    AlertCircle,
    CheckCircle2,
    ShieldAlert
} from "lucide-react";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrg } from "@/hooks/useOrg"; // Multi-tenant context
import { useAuth } from "@/hooks/useAuth";
import BookingParticipants from "@/components/BookingParticipants";
import PreCheckinSessions from "@/components/PreCheckinSessions";
import PreCheckinSubmissionsComponent from "@/components/PreCheckinSubmissionsComponent";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const FolioPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg(); // Get current org context
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';

    const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
        queryKey: ['booking-folio', currentOrgId, id], // Include org_id in cache key
        queryFn: async () => {
            // 🔐 SECURITY: Abort if no org_id - prevents unauthorized access
            if (!currentOrgId) {
                console.warn('[FolioPage] Abortando fetch: currentOrgId indefinido.');
                throw new Error('ORG_REQUIRED');
            }

            console.log('[FolioPage] Fetching booking...', { currentOrgId, bookingId: id });

            const { data, error } = await supabase
                .from('bookings')
                .select('*, properties(*)')
                .eq('id', id)
                .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
                .single();

            if (error) {
                // Don't leak whether booking exists in other org
                if (error.code === 'PGRST116') {
                    throw new Error('NOT_FOUND');
                }
                throw error;
            }
            return data;
        },
        enabled: !isOrgLoading && !!currentOrgId && !!id, // Enable only when org is loaded
    });

    const { items, payments, totals, isLoading: folioLoading, addItem, addPayment, closeFolio } = useFolio(id, currentOrgId);
    const { toast } = useToast();

    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const [newItem, setNewItem] = useState({ description: "", amount: "", category: "service" as const });
    const [newPay, setNewPay] = useState({ amount: "", method: "cash" as const });

    const handleAddItem = async () => {
        if (!newItem.description || !newItem.amount || isViewer) return;
        await addItem.mutateAsync({
            booking_id: id!,
            description: newItem.description,
            amount: parseFloat(newItem.amount),
            category: newItem.category,
            property_id: booking?.property_id
        } as any);
        setIsItemDialogOpen(false);
        setNewItem({ description: "", amount: "", category: "service" });
    };

    const handleAddPayment = async () => {
        if (!newPay.amount || isViewer) return;
        await addPayment.mutateAsync({
            booking_id: id!,
            amount: parseFloat(newPay.amount),
            method: newPay.method,
            property_id: booking?.property_id
        } as any);
        setIsPaymentDialogOpen(false);
        setNewPay({ amount: "", method: "cash" });
    };

    // Hash-based scroll navigation for quick actions
    useEffect(() => {
        if (location.hash) {
            const targetId = location.hash.substring(1); // Remove '#'
            const element = document.getElementById(targetId);
            if (element) {
                // Delay to ensure DOM is fully rendered
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [location.hash, bookingLoading, folioLoading]);

    // Loading state
    if (isOrgLoading || bookingLoading || folioLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Carregando folio...</p>
                </div>
            </div>
        );
    }

    // Access restricted state (org missing or booking not found in org)
    if (!currentOrgId || bookingError || !booking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <ShieldAlert className="h-8 w-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">Acesso Restrito</h3>
                            <p className="text-sm text-muted-foreground">
                                Você não tem permissão para acessar este registro ou ele não existe.
                            </p>
                        </div>
                        <Button onClick={() => window.history.back()} variant="outline">
                            Voltar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const exportCSV = () => {
        const headers = ["Data", "Descrição", "Categoria", "Débito", "Crédito"];
        const rows = [
            ...items.map(item => [
                format(new Date(item.created_at), "dd/MM/yyyy"),
                item.description,
                item.category,
                item.amount.toFixed(2),
                "0.00"
            ]),
            ...payments.map(pay => [
                format(new Date(pay.payment_date), "dd/MM/yyyy"),
                `Pagamento - ${pay.method}`,
                "pagamento",
                "0.00",
                pay.amount.toFixed(2)
            ])
        ];

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `folio-${booking.guest_name}-${id?.substring(0, 8)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <EntityDetailTemplate
            title={`Folio: ${booking.guest_name}`}
            subtitle={`Reserva #${id?.substring(0, 8)} | ${booking.properties?.name}`}
            headerIcon={<Receipt className="h-7 w-7 text-primary" />}
            backUrl="/bookings"
            badge={
                <Badge variant={totals.balance <= 0 ? "success" : "destructive"} className="uppercase font-bold pt-0.5">
                    {totals.balance <= 0 ? "Saldo Quitado" : "Débito Pendente"}
                </Badge>
            }
            actionsSection={
                <>
                    <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-1 border-primary/20 bg-primary/5"
                        onClick={() => setIsItemDialogOpen(true)}
                        disabled={isViewer}
                    >
                        <Plus className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-bold">Lançar Extra</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-1 border-success/20 bg-success/5"
                        onClick={() => setIsPaymentDialogOpen(true)}
                        disabled={totals.balance <= 0 || isViewer}
                    >
                        <DollarSign className="h-5 w-5 text-success" />
                        <span className="text-[10px] font-bold">Pagar</span>
                    </Button>
                    {totals.balance <= 0 && booking.status !== 'completed' && !isViewer && (
                        <Button
                            variant="hero"
                            className="h-auto py-4 flex flex-col gap-1 shadow-md scale-105"
                            onClick={() => closeFolio.mutate()}
                            disabled={closeFolio.isPending}
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-[10px] font-bold truncate">Fechar Conta</span>
                        </Button>
                    )}
                </>
            }
        >
            {/* KPI Totals */}
            <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Total Lançado" value={`R$ ${totals.totalCharges.toFixed(2)}`} />
                <KpiCard label="Total Pago" value={`R$ ${totals.totalPaid.toFixed(2)}`} variant="emerald" />
                <KpiCard
                    label="Saldo"
                    value={`R$ ${totals.balance.toFixed(2)}`}
                    variant={totals.balance > 0 ? "rose" : "default"}
                />
            </div>

            {/* Booking Participants */}
            <div id="participants">
                <BookingParticipants bookingId={id!} />
            </div>

            {/* Pre-Check-in Sessions */}
            <div id="precheckin">
                <PreCheckinSessions bookingId={id!} />
            </div>

            {/* Pre-Check-in Submissions */}
            <PreCheckinSubmissionsComponent bookingId={id!} />

            {/* Extrato Detalhado */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 border-b bg-card flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base text-card-foreground">Extrato Movimentações</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={exportCSV} className="h-8 text-[10px] gap-1">
                        <Download className="h-3 w-3" /> Exportar CSV
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-dashed">
                        {items.length === 0 && payments.length === 0 && (
                            <div className="p-10 text-center text-muted-foreground text-sm">
                                Nenhuma movimentação registrada.
                            </div>
                        )}

                        {items.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
                                        <AlertCircle className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{item.description}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ptBR })} • {item.category}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-rose-600">R$ {item.amount.toFixed(2)}</p>
                            </div>
                        ))}

                        {payments.map((pay) => (
                            <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Pagamento: {pay.method.toUpperCase()}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {format(new Date(pay.payment_date), "dd MMM, HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-emerald-600">- R$ {pay.amount.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Checkout Alert if balance > 0 */}
            {totals.balance > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-700">Saldo Pendente</p>
                        <p className="text-xs text-amber-600">
                            Esta reserva possui um saldo de <b>R$ {totals.balance.toFixed(2)}</b> em aberto.
                            Registre o pagamento para permitir o check-out.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Item Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Lançar Extra / Ajuste</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input
                                id="description"
                                placeholder="Ex: Frigobar, Lavanderia..."
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Valor (R$)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={newItem.amount}
                                    onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Select
                                    value={newItem.category}
                                    onValueChange={(v: any) => setNewItem({ ...newItem, category: v })}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="service">Serviço</SelectItem>
                                        <SelectItem value="rate">Diária</SelectItem>
                                        <SelectItem value="adjustment">Ajuste</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddItem} disabled={addItem.isPending}>
                            {addItem.isPending ? "Lançando..." : "Confirmar Lançamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Registrar Pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pay-amount">Valor (R$)</Label>
                            <Input
                                id="pay-amount"
                                type="number"
                                value={newPay.amount}
                                onChange={e => setNewPay({ ...newPay, amount: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="method">Forma de Pagamento</Label>
                            <Select
                                value={newPay.method}
                                onValueChange={(v: any) => setNewPay({ ...newPay, method: v })}
                            >
                                <SelectTrigger id="method">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                    <SelectItem value="card">Cartão (Local)</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="stripe">Stripe / Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddPayment} disabled={addPayment.isPending} className="bg-success hover:bg-success/90">
                            {addPayment.isPending ? "Processando..." : "Confirmar Pagamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </EntityDetailTemplate>
    );
};

export default FolioPage;
