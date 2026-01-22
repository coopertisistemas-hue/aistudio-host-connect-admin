import { useToast } from "@/hooks/use-toast";
import { useUpdateBookingStatus } from "@/hooks/useUpdateBookingStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ArrivalReadiness {
    status: 'READY' | 'WARNING' | 'BLOCKED';
    reasons: Array<'ROOM' | 'PRIMARY_GUEST' | 'PRECHECKIN'>;
}

interface GuidedCheckinPanelProps {
    selectedBookingId: string | null;
    onClose: () => void;
    arrivalsToday: any[];
    arrivalsTodayReadiness: Record<string, ArrivalReadiness>;
    bookingGuests: any[];
    precheckinSessions: any[];
    isViewer: boolean;
}

export const GuidedCheckinPanel = ({
    selectedBookingId,
    onClose,
    arrivalsToday,
    arrivalsTodayReadiness,
    bookingGuests,
    precheckinSessions,
    isViewer,
}: GuidedCheckinPanelProps) => {
    const { toast } = useToast();
    const [showCheckinConfirmation, setShowCheckinConfirmation] = useState(false);

    if (!selectedBookingId) return null;

    const booking = arrivalsToday.find(b => b.id === selectedBookingId);
    if (!booking) return null;

    const readiness = arrivalsTodayReadiness[selectedBookingId];
    if (!readiness) return null;

    const hasRoom = !!(booking.primary_room_id || booking.room_id);
    const hasPrimaryGuest = bookingGuests.filter(g => g.booking_id === selectedBookingId).some(g => g.is_primary);
    const hasPendingPrecheckin = precheckinSessions.filter(s => s.booking_id === selectedBookingId).some(s => s.status === 'pending' || s.status === 'incomplete');

    // Get status badge
    const getStatusBadge = () => {
        switch (readiness.status) {
            case 'READY':
                return <Badge className="bg-emerald-500 text-white">Pronto</Badge>;
            case 'WARNING':
                return <Badge className="bg-amber-500 text-white">Pendência</Badge>;
            case 'BLOCKED':
                return <Badge className="bg-red-600 text-white">Bloqueado</Badge>;
        }
    };

    // Handle check-in action
    const { mutate: performCheckin, isPending: isCheckingIn } = useUpdateBookingStatus();

    const handleFinalizeCheckin = () => {
        // If WARNING, show confirmation
        if (readiness.status === 'WARNING') {
            setShowCheckinConfirmation(true);
            return;
        }

        // If BLOCKED, show toast
        if (readiness.status === 'BLOCKED') {
            const reasons = readiness.reasons.map(r => {
                switch (r) {
                    case 'ROOM': return 'Sem quarto';
                    case 'PRIMARY_GUEST': return 'Sem hóspede principal';
                    case 'PRECHECKIN': return 'Pré-check-in pendente';
                }
            }).join(', ');

            toast({
                title: "Não é possível fazer check-in",
                description: reasons,
                variant: "destructive",
            });
            return;
        }

        // READY: perform check-in
        performCheckin({
            bookingId: selectedBookingId,
            newStatus: 'checked_in' as any,
        }, {
            onSuccess: () => {
                toast({
                    title: "Check-in finalizado",
                    description: "Hóspede registrado com sucesso.",
                });
                onClose();
            },
        });
    };

    const confirmCheckin = () => {
        setShowCheckinConfirmation(false);
        performCheckin({
            bookingId: selectedBookingId,
            newStatus: 'checked_in' as any,
        }, {
            onSuccess: () => {
                toast({
                    title: "Check-in finalizado",
                    description: "Hóspede registrado com sucesso.",
                });
                onClose();
            },
        });
    };

    return (
        <>
            <Sheet open={!!selectedBookingId} onOpenChange={(open) => !open && onClose()}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Check-in</SheetTitle>
                        <SheetDescription>
                            <div className="space-y-2">
                                <p className="text-base font-semibold text-foreground">{booking.guest_name}</p>
                                {getStatusBadge()}
                            </div>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {/* Checklist */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Checklist Operacional</h3>

                            <div className="space-y-2">
                                {/* Room */}
                                <div className="flex items-center gap-3 p-3 rounded-lg border">
                                    {hasRoom ? (
                                        <Check className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <X className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-sm flex-1">Quarto atribuído</span>
                                    <span className="text-sm font-medium">{hasRoom ? 'Sim' : 'Não'}</span>
                                </div>

                                {/* Primary Guest */}
                                <div className="flex items-center gap-3 p-3 rounded-lg border">
                                    {hasPrimaryGuest ? (
                                        <Check className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <X className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-sm flex-1">Hóspede principal</span>
                                    <span className="text-sm font-medium">{hasPrimaryGuest ? 'Sim' : 'Não'}</span>
                                </div>

                                {/* Precheckin */}
                                <div className="flex items-center gap-3 p-3 rounded-lg border">
                                    {!hasPendingPrecheckin ? (
                                        <Check className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                    )}
                                    <span className="text-sm flex-1">Pré-check-in</span>
                                    <span className="text-sm font-medium">{hasPendingPrecheckin ? 'Pendente' : 'OK'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={handleFinalizeCheckin}
                            disabled={isViewer || readiness.status === 'BLOCKED' || isCheckingIn}
                            className="w-full"
                            size="lg"
                        >
                            {isCheckingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalizar Check-in
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Confirmation Dialog for WARNING */}
            <AlertDialog open={showCheckinConfirmation} onOpenChange={setShowCheckinConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pré-check-in pendente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja finalizar o check-in mesmo assim?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCheckin}>Finalizar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
