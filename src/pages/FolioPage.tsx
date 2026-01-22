import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useUpdateRoomStatus } from "@/hooks/useUpdateRoomStatus";
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
    ShieldAlert,
    Check,
    X,
    Ban,
    LogOut
} from "lucide-react";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrg } from "@/hooks/useOrg"; // Multi-tenant context
import { useAuth } from "@/hooks/useAuth";
import BookingParticipants from "@/components/BookingParticipants";
import PreCheckinSessions from "@/components/PreCheckinSessions";
import PreCheckinSubmissionsComponent from "@/components/PreCheckinSubmissionsComponent";
import { BookingStatus, canCheckIn, canCheckOut, canCancel, canMarkNoShow, normalizeLegacyStatus, getBookingStatusLabel } from "@/lib/constants/statuses";
import { useUpdateBookingStatus } from "@/hooks/useUpdateBookingStatus";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRooms } from "@/hooks/useRooms";
import { useBookingRooms, useAssignRoomToBooking, useUnassignRoomFromBooking } from "@/hooks/useBookingRooms";
import { useBookingGroup, useCreateBookingGroup, useUpdateBookingGroup, useDeleteBookingGroup } from "@/hooks/useBookingGroups";
import { Users as UsersIcon } from "lucide-react";

const FolioPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg(); // Get current org context
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';
    const updateStatus = useUpdateBookingStatus();
    const { toast } = useToast();

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

    const { data: bookingRooms = [], isLoading: bookingRoomsLoading } = useBookingRooms(id, booking?.property_id);
    const { data: allRooms = [] } = useRooms(booking?.property_id);
    const assignRoom = useAssignRoomToBooking();
    const unassignRoom = useUnassignRoomFromBooking(booking?.property_id!, id!);

    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const primaryRoom = bookingRooms.find(br => br.is_primary);

    const handleAssignRoom = async (roomId: string) => {
        if (isViewer || !booking?.property_id) return;
        await assignRoom.mutateAsync({
            bookingId: id!,
            roomId,
            propertyId: booking.property_id
        });
        setIsAssignDialogOpen(false);
    };

    const handleUnassignRoom = async (bookingRoomId: string) => {
        if (isViewer) return;
        if (window.confirm("Deseja desvincular este quarto da reserva?")) {
            await unassignRoom.mutateAsync(bookingRoomId);
        }
    };

    // Group management state
    const { group: bookingGroup, isLoading: groupLoading } = useBookingGroup(id, booking?.property_id);
    const createGroup = useCreateBookingGroup();
    const updateGroup = useUpdateBookingGroup();
    const deleteGroup = useDeleteBookingGroup();
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [groupForm, setGroupForm] = useState({
        group_name: '',
        leader_name: '',
        leader_phone: '',
        estimated_participants: '',
        notes: '',
    });

    useEffect(() => {
        if (bookingGroup) {
            setGroupForm({
                group_name: bookingGroup.group_name || '',
                leader_name: bookingGroup.leader_name || '',
                leader_phone: bookingGroup.leader_phone || '',
                estimated_participants: bookingGroup.estimated_participants?.toString() || '',
                notes: bookingGroup.notes || '',
            });
        } else {
            setGroupForm({
                group_name: '',
                leader_name: '',
                leader_phone: '',
                estimated_participants: '',
                notes: '',
            });
        }
    }, [bookingGroup, isGroupDialogOpen]);

    const handleSaveGroup = async () => {
        if (isViewer || !booking?.property_id) return;

        if (!groupForm.group_name.trim()) {
            toast({
                title: 'Campo obrigatório',
                description: 'O nome do grupo é obrigatório.',
                variant: 'destructive',
            });
            return;
        }

        const groupData = {
            property_id: booking.property_id,
            booking_id: id!,
            group_name: groupForm.group_name,
            leader_name: groupForm.leader_name || null,
            leader_phone: groupForm.leader_phone || null,
            estimated_participants: groupForm.estimated_participants ? parseInt(groupForm.estimated_participants) : null,
            notes: groupForm.notes || null,
        };

        if (bookingGroup) {
            await updateGroup.mutateAsync({
                groupId: bookingGroup.id,
                propertyId: booking.property_id,
                bookingId: id!,
                updates: groupData,
            });
        } else {
            await createGroup.mutateAsync(groupData);
        }
        setIsGroupDialogOpen(false);
    };

    const handleDeleteGroup = async () => {
        if (isViewer || !bookingGroup || !booking?.property_id) return;
        if (window.confirm("Deseja remover o grupo desta reserva?")) {
            await deleteGroup.mutateAsync({
                groupId: bookingGroup.id,
                propertyId: booking.property_id,
                bookingId: id!,
            });
        }
    };

    const normalizedStatus = booking ? normalizeLegacyStatus(booking.status as any) : null;
    const updateRoomStatus = useUpdateRoomStatus();

    const [isCheckoutSuggestionOpen, setIsCheckoutSuggestionOpen] = useState(false);

    const handleCheckIn = () => {
        if (!normalizedStatus || !canCheckIn(normalizedStatus)) {
            toast({ title: 'Ação indisponível', description: 'Status não permite check-in.', variant: 'destructive' });
            return;
        }

        if (!primaryRoom) {
            toast({
                title: 'Check-in bloqueado',
                description: 'É necessário atribuir um quarto antes de realizar o check-in.',
                variant: 'destructive',
            });
            return;
        }

        const hasPrimaryGuest = participants.some(p => p.is_primary);
        if (!hasPrimaryGuest) {
            toast({
                title: 'Check-in bloqueado',
                description: 'A reserva deve ter ao menos um hóspede principal definido.',
                variant: 'destructive',
            });
            return;
        }

        updateStatus.mutate({ bookingId: id!, newStatus: BookingStatus.CHECKED_IN });
    };

    const handleCheckOut = () => {
        if (!normalizedStatus || !canCheckOut(normalizedStatus)) {
            toast({ title: 'Ação indisponível', description: 'Status não permite check-out.', variant: 'destructive' });
            return;
        }
        updateStatus.mutate({
            bookingId: id!,
            newStatus: BookingStatus.CHECKED_OUT
        }, {
            onSuccess: () => {
                if (primaryRoom && !isViewer) {
                    setIsCheckoutSuggestionOpen(true);
                }
            }
        });
    };

    const handleCancel = () => {
        if (!normalizedStatus || !canCancel(normalizedStatus)) {
            toast({ title: 'Ação indisponível', description: 'Status não permite cancelamento.', variant: 'destructive' });
            return;
        }
        updateStatus.mutate({ bookingId: id!, newStatus: BookingStatus.CANCELLED });
    };

    const handleNoShow = () => {
        if (!normalizedStatus || !canMarkNoShow(normalizedStatus)) {
            toast({ title: 'Ação indisponível', description: 'Status não permite no-show.', variant: 'destructive' });
            return;
        }
        updateStatus.mutate({ bookingId: id!, newStatus: BookingStatus.NO_SHOW });
    };

    const confirmMarkDirty = async () => {
        if (!primaryRoom || !booking?.property_id) return;
        await updateRoomStatus.mutateAsync({
            roomId: primaryRoom.room_id,
            newStatus: 'dirty',
            propertyId: booking.property_id
        });
        setIsCheckoutSuggestionOpen(false);
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

                    {/* Lifecycle Actions */}
                    {normalizedStatus && canCheckIn(normalizedStatus) && (
                        <Button
                            variant="default"
                            className="h-auto py-4 flex flex-col gap-1"
                            onClick={handleCheckIn}
                            disabled={isViewer || updateStatus.isPending}
                        >
                            <Check className="h-5 w-5" />
                            <span className="text-[10px] font-bold">Check-in</span>
                        </Button>
                    )}
                    {normalizedStatus && canCheckOut(normalizedStatus) && (
                        <Button
                            variant="default"
                            className="h-auto py-4 flex flex-col gap-1"
                            onClick={handleCheckOut}
                            disabled={isViewer || updateStatus.isPending}
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="text-[10px] font-bold">Check-out</span>
                        </Button>
                    )}
                    {normalizedStatus && canCancel(normalizedStatus) && (
                        <Button
                            variant="destructive"
                            className="h-auto py-4 flex flex-col gap-1"
                            onClick={handleCancel}
                            disabled={isViewer || updateStatus.isPending}
                        >
                            <X className="h-5 w-5" />
                            <span className="text-[10px] font-bold">Cancelar</span>
                        </Button>
                    )}
                    {normalizedStatus && canMarkNoShow(normalizedStatus) && (
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-1"
                            onClick={handleNoShow}
                            disabled={isViewer || updateStatus.isPending}
                        >
                            <Ban className="h-5 w-5" />
                            <span className="text-[10px] font-bold">No-show</span>
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
                    variant={totals.balance > 0 ? "rose" : "default"}
                />
            </div>

            {/* Room Assignment Section */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-6 border-b bg-card flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base text-card-foreground">Quarto</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {primaryRoom ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {primaryRoom.room?.room_number}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Quarto {primaryRoom.room?.room_number}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{primaryRoom.room?.status}</p>
                                </div>
                            </div>
                            {!isViewer && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                    onClick={() => handleUnassignRoom(primaryRoom.id)}
                                >
                                    Remover
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4 space-y-3">
                            <p className="text-sm text-muted-foreground">Nenhum quarto atribuído a esta reserva.</p>
                            {!isViewer && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAssignDialogOpen(true)}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Atribuir Quarto
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Group Section */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-6 border-b bg-card flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base text-card-foreground">Grupo</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {bookingGroup ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{bookingGroup.group_name}</p>
                                    {bookingGroup.leader_name && (
                                        <p className="text-xs text-muted-foreground">
                                            Responsável: {bookingGroup.leader_name}
                                        </p>
                                    )}
                                    {bookingGroup.estimated_participants && (
                                        <p className="text-xs text-muted-foreground">
                                            Participantes estimados: {bookingGroup.estimated_participants}
                                        </p>
                                    )}
                                </div>
                                {!isViewer && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsGroupDialogOpen(true)}
                                            className="h-8"
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                            onClick={handleDeleteGroup}
                                        >
                                            Remover
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {bookingGroup.notes && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">{bookingGroup.notes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4 space-y-3">
                            <p className="text-sm text-muted-foreground">Sem grupo definido para esta reserva.</p>
                            {!isViewer && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsGroupDialogOpen(true)}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Criar Grupo
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

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

            {/* Room Assignment Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Selecionar Quarto</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                        {allRooms.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Nenhum quarto cadastrado.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {allRooms.map((room) => (
                                    <Button
                                        key={room.id}
                                        variant="outline"
                                        className="h-16 flex flex-col items-center justify-center gap-1 border-primary/20 hover:border-primary hover:bg-primary/5"
                                        onClick={() => handleAssignRoom(room.id)}
                                        disabled={assignRoom.isPending}
                                    >
                                        <span className="text-lg font-bold">{room.room_number}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{room.status}</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Housekeeping Suggestion */}
            <AlertDialog open={isCheckoutSuggestionOpen} onOpenChange={setIsCheckoutSuggestionOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Atualizar status do quarto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja marcar o quarto {primaryRoom?.room?.room_number} como sujo?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Agora não</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmMarkDirty} className="bg-destructive hover:bg-destructive/90">
                            Sim, marcar como sujo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Group Dialog */}
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{bookingGroup ? 'Editar Grupo' : 'Criar Grupo'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="group-name">Nome do Grupo *</Label>
                            <Input
                                id="group-name"
                                value={groupForm.group_name}
                                onChange={e => setGroupForm({ ...groupForm, group_name: e.target.value })}
                                placeholder="Ex: Excursão Semana Santa 2026"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="leader-name">Nome do Responsável</Label>
                            <Input
                                id="leader-name"
                                value={groupForm.leader_name}
                                onChange={e => setGroupForm({ ...groupForm, leader_name: e.target.value })}
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="leader-phone">Telefone do Responsável</Label>
                            <Input
                                id="leader-phone"
                                value={groupForm.leader_phone}
                                onChange={e => setGroupForm({ ...groupForm, leader_phone: e.target.value })}
                                placeholder="Ex: (11) 98765-4321"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="estimated-participants">Participantes Estimados</Label>
                            <Input
                                id="estimated-participants"
                                type="number"
                                value={groupForm.estimated_participants}
                                onChange={e => setGroupForm({ ...groupForm, estimated_participants: e.target.value })}
                                placeholder="Ex: 25"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Input
                                id="notes"
                                value={groupForm.notes}
                                onChange={e => setGroupForm({ ...groupForm, notes: e.target.value })}
                                placeholder="Informações adicionais sobre o grupo"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsGroupDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveGroup}
                            disabled={createGroup.isPending || updateGroup.isPending}
                        >
                            {createGroup.isPending || updateGroup.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </EntityDetailTemplate>
    );
};

export default FolioPage;
