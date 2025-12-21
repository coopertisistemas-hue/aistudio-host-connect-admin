import { useState } from "react";
import { useLeads, ReservationLead } from "@/hooks/useLeads";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trophy, Home, DollarSign } from "lucide-react";

interface WinLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: ReservationLead;
    onSuccess?: () => void;
}

const WinLeadDialog = ({ open, onOpenChange, lead, onSuccess }: WinLeadDialogProps) => {
    const { convertLeadToBooking } = useLeads(lead.property_id);
    const { roomTypes, isLoading: loadingRooms } = useRoomTypes(lead.property_id);

    const [roomTypeId, setRoomTypeId] = useState("");
    const [totalAmount, setTotalAmount] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomTypeId) return;

        convertLeadToBooking.mutate({
            lead,
            room_type_id: roomTypeId,
            total_amount: totalAmount
        }, {
            onSuccess: () => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <Trophy className="h-5 w-5" /> Converter em Reserva
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Parabéns! Defina os detalhes finais para criar a reserva para <strong>{lead.guest_name}</strong>.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="room-type" className="text-xs font-bold uppercase">Tipo de Acomodação</Label>
                        <Select value={roomTypeId} onValueChange={setRoomTypeId} required>
                            <SelectTrigger id="room-type">
                                <SelectValue placeholder={loadingRooms ? "Carregando..." : "Selecione a categoria"} />
                            </SelectTrigger>
                            <SelectContent>
                                {roomTypes.map((rt) => (
                                    <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-bold uppercase">Valor Total do Pacote (R$)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="pl-10"
                                required
                                value={totalAmount || ""}
                                onChange={e => setTotalAmount(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 font-bold" disabled={convertLeadToBooking.isPending}>
                            Confirmar e Criar Reserva
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WinLeadDialog;
