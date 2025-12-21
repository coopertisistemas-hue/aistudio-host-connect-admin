import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, User, Phone, Mail, Globe } from "lucide-react";

interface LeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: string;
}

const LeadDialog = ({ open, onOpenChange, propertyId }: LeadDialogProps) => {
    const { createLead } = useLeads(propertyId);
    const [formData, setFormData] = useState({
        guest_name: "",
        guest_phone: "",
        guest_email: "",
        source: "manual",
        channel: "",
        adults: 1,
        children: 0,
        notes: "",
    });
    const [checkIn, setCheckIn] = useState<Date>();
    const [checkOut, setCheckOut] = useState<Date>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createLead.mutate({
            ...formData,
            property_id: propertyId,
            status: 'new',
            check_in_date: checkIn ? format(checkIn, "yyyy-MM-dd") : null,
            check_out_date: checkOut ? format(checkOut, "yyyy-MM-dd") : null,
            assigned_to: null,
        }, {
            onSuccess: () => {
                onOpenChange(false);
                setFormData({
                    guest_name: "",
                    guest_phone: "",
                    guest_email: "",
                    source: "manual",
                    channel: "",
                    adults: 1,
                    children: 0,
                    notes: "",
                });
                setCheckIn(undefined);
                setCheckOut(undefined);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary p-6 text-primary-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2">
                            <Globe className="h-5 w-5" /> Novo Lead de Reserva
                        </DialogTitle>
                        <p className="text-primary-foreground/70 text-sm">Capture o interesse de um novo hóspede.</p>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">Nome do Hóspede *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Ex: João Silva"
                                        className="pl-10"
                                        required
                                        value={formData.guest_name}
                                        onChange={e => setFormData({ ...formData, guest_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider">Telefone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        placeholder="(48) 99999-9999"
                                        className="pl-10"
                                        value={formData.guest_phone}
                                        onChange={e => setFormData({ ...formData, guest_phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source" className="text-xs font-bold uppercase tracking-wider">Origem</Label>
                                <Select value={formData.source} onValueChange={v => setFormData({ ...formData, source: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="portal">Portal Urubici</SelectItem>
                                        <SelectItem value="booking">Booking.com</SelectItem>
                                        <SelectItem value="google">Google</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider">Check-in</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkIn && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {checkIn ? format(checkIn, "dd/MM/yyyy") : "Selecionar"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider">Check-out</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkOut && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {checkOut ? format(checkOut, "dd/MM/yyyy") : "Selecionar"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider">Observações</Label>
                            <Textarea
                                id="notes"
                                placeholder="Detalhes da consulta, preferências, etc."
                                className="resize-none h-20"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="font-bold px-8" disabled={createLead.isPending}>
                            Salvar Lead
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default LeadDialog;
