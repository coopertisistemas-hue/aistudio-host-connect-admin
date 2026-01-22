import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
    LogIn,
    LogOut,
    FileText,
    Calendar,
    User,
    BedDouble,
    X,
    Ban,
    AlertCircle,
    Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Booking } from "@/hooks/useBookings";
import { BookingStatus, getBookingStatusLabel, canCheckIn, canCheckOut, canCancel, canMarkNoShow, normalizeLegacyStatus } from "@/lib/constants/statuses";
import { useUpdateBookingStatus } from "@/hooks/useUpdateBookingStatus";
import { useUpdateRoomStatus } from "@/hooks/useUpdateRoomStatus";
import { useBookingRooms } from "@/hooks/useBookingRooms";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FrontDeskBookingCardProps {
    booking: Booking;
    onOpenFolio: (bookingId: string) => void;
    alerts?: { precheckinPending: boolean; noPrimaryGuest: boolean; arrivalNoCheckin: boolean };
    hasGroup?: boolean;
    precheckinCount?: number;
    participantCount?: number;
}

export const FrontDeskBookingCard = ({
    booking,
    onOpenFolio,
    alerts,
    hasGroup = false,
    precheckinCount = 0,
    participantCount = 0,
}: FrontDeskBookingCardProps) => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const { toast } = useToast();
    const updateStatus = useUpdateBookingStatus();
    const { data: bookingRooms = [] } = useBookingRooms(booking.id, booking.property_id);
    const primaryRoom = bookingRooms.find(br => br.is_primary);
    const updateRoomStatus = useUpdateRoomStatus();
    const [isCheckoutSuggestionOpen, setIsCheckoutSuggestionOpen] = useState(false);
    const isViewer = userRole === 'viewer';

    const normalizedStatus = normalizeLegacyStatus(booking.status);

    // Compute blockers for this booking
    const blockers = useMemo(() => {
        const list: Array<{ type: string, message: string }> = [];

        if (!primaryRoom) {
            list.push({ type: 'error', message: 'Quarto não atribuído' });
        }

        if (alerts?.noPrimaryGuest) {
            list.push({ type: 'error', message: 'Sem hóspede principal' });
        }

        if (alerts?.precheckinPending) {
            list.push({ type: 'warning', message: 'Pré-check-in pendente' });
        }

        return list;
    }, [primaryRoom, alerts]);

    const hasBlockers = blockers.filter(b => b.type === 'error').length > 0;

    const handleCheckIn = () => {
        if (!canCheckIn(normalizedStatus)) {
            toast({
                title: 'Ação indisponível',
                description: 'Ação indisponível para o status atual.',
                variant: 'destructive',
            });
            return;
        }

        if (!primaryRoom) {
            toast({
                title: 'Check-in bloqueado',
                description: 'Atribua um quarto à reserva antes de realizar o check-in.',
                variant: 'destructive',
            });
            return;
        }

        if (alerts?.noPrimaryGuest) {
            toast({
                title: 'Check-in bloqueado',
                description: 'A reserva deve ter ao menos um hóspede principal definido.',
                variant: 'destructive',
            });
            return;
        }

        updateStatus.mutate({ bookingId: booking.id, newStatus: BookingStatus.CHECKED_IN });
    };

    const handleCheckOut = () => {
        if (!canCheckOut(normalizedStatus)) {
            toast({
                title: 'Ação indisponível',
                description: 'Ação indisponível para o status atual.',
                variant: 'destructive',
            });
            return;
        }
        updateStatus.mutate({
            bookingId: booking.id,
            newStatus: BookingStatus.CHECKED_OUT
        }, {
            onSuccess: () => {
                if (primaryRoom && !isViewer) {
                    setIsCheckoutSuggestionOpen(true);
                }
            }
        });
    };

    const confirmMarkDirty = async () => {
        if (!primaryRoom || !booking.property_id) return;
        await updateRoomStatus.mutateAsync({
            roomId: primaryRoom.room_id,
            newStatus: 'dirty',
            propertyId: booking.property_id
        });
        setIsCheckoutSuggestionOpen(false);
    };

    const handleCancel = () => {
        if (!canCancel(normalizedStatus)) {
            toast({
                title: 'Ação indisponível',
                description: 'Ação indisponível para o status atual.',
                variant: 'destructive',
            });
            return;
        }
        updateStatus.mutate({ bookingId: booking.id, newStatus: BookingStatus.CANCELLED });
    };

    const handleNoShow = () => {
        if (!canMarkNoShow(normalizedStatus)) {
            toast({
                title: 'Ação indisponível',
                description: 'Ação indisponível para o status atual.',
                variant: 'destructive',
            });
            return;
        }
        updateStatus.mutate({ bookingId: booking.id, newStatus: BookingStatus.NO_SHOW });
    };

    return (
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-md">
            <CardContent className="p-3">
                <div className="space-y-2">
                    {/* Top Line: Guest + Room + Status + Blockers */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-semibold text-sm truncate">
                                {booking.guest_name || 'Hóspede'}
                            </span>
                            {primaryRoom && (
                                <>
                                    <span className="text-muted-foreground text-xs">•</span>
                                    <div className="flex items-center gap-1 text-primary">
                                        <BedDouble className="h-3 w-3" />
                                        <span className="text-xs font-semibold">#{primaryRoom.room?.room_number}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            {/* Blockers Popover */}
                            {blockers.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <div className="relative">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                <Badge className="absolute -top-1 -right-1 h-3.5 w-3.5 p-0 flex items-center justify-center text-[9px]">
                                                    {blockers.length}
                                                </Badge>
                                            </div>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Bloqueios</h4>
                                            {blockers.map((blocker, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <AlertCircle className={`h-3 w-3 ${blocker.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                                                    <span>{blocker.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}

                            <Badge variant="secondary" className="text-xs h-6 shrink-0">
                                {getBookingStatusLabel(booking.status)}
                            </Badge>
                        </div>
                    </div>

                    {/* Second Line: Dates + Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                                {format(parseISO(booking.check_in), 'dd/MM', { locale: ptBR })} - {format(parseISO(booking.check_out), 'dd/MM', { locale: ptBR })}
                            </span>
                        </div>

                        {hasGroup && (
                            <>
                                <span className="text-muted-foreground text-xs">•</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-purple-50 text-purple-700 border-purple-200">
                                    <Users className="h-3 w-3 mr-1" />
                                    Grupo
                                </Badge>
                            </>
                        )}

                        {participantCount > 0 && (
                            <>
                                <span className="text-muted-foreground text-xs">•</span>
                                <span className="text-[10px] text-muted-foreground">
                                    {participantCount} participante{participantCount > 1 ? 's' : ''}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Peak Actions Row */}
                    <div className="flex flex-wrap gap-1 pt-1 border-t">
                        {/* Quick Access Shortcuts */}
                        <Button
                            onClick={() => onOpenFolio(booking.id)}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                        >
                            <FileText className="h-3 w-3 mr-1" />
                            Folio
                        </Button>

                        <Button
                            onClick={() => navigate(`/operation/folio/${booking.id}#participants`)}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                        >
                            <User className="h-3 w-3 mr-1" />
                            Hóspedes {participantCount > 0 && `(${participantCount})`}
                        </Button>

                        <Button
                            onClick={() => navigate(`/operation/folio/${booking.id}#precheckin`)}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                        >
                            <Calendar className="h-3 w-3 mr-1" />
                            Pré-checkin {precheckinCount > 0 && `(${precheckinCount})`}
                        </Button>

                        {/* Lifecycle Actions */}
                        {canCheckIn(normalizedStatus) && (
                            <Button
                                onClick={handleCheckIn}
                                disabled={isViewer || updateStatus.isPending || hasBlockers}
                                size="sm"
                                variant="default"
                                className="text-xs h-7 px-2"
                                title={hasBlockers ? 'Check-in bloqueado por pendências' : 'Realizar check-in'}
                            >
                                <LogIn className="h-3 w-3 mr-1" />
                                Check-in
                            </Button>
                        )}

                        {canCheckOut(normalizedStatus) && (
                            <Button
                                onClick={handleCheckOut}
                                disabled={isViewer || updateStatus.isPending}
                                size="sm"
                                variant="default"
                                className="text-xs h-7 px-2"
                            >
                                <LogOut className="h-3 w-3 mr-1" />
                                Check-out
                            </Button>
                        )}

                        {canCancel(normalizedStatus) && (
                            <Button
                                onClick={handleCancel}
                                disabled={isViewer || updateStatus.isPending}
                                size="sm"
                                variant="destructive"
                                className="text-xs h-7 px-2"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                            </Button>
                        )}

                        {canMarkNoShow(normalizedStatus) && (
                            <Button
                                onClick={handleNoShow}
                                disabled={isViewer || updateStatus.isPending}
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2"
                            >
                                <Ban className="h-3 w-3 mr-1" />
                                No-show
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>

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
        </Card>
    );
};
