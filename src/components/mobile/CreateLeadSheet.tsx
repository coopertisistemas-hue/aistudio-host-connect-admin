import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMobileReservations } from "@/hooks/useMobileReservations";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, Plus, Users, Calendar, UserPlus } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";

export const CreateLeadSheet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const { selectedPropertyId } = useSelectedProperty();
    const { actions } = useMobileReservations(selectedPropertyId);

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 2)
    });
    const [adults, setAdults] = useState(2);
    const [childrenCount, setChildrenCount] = useState(0);
    const [notes, setNotes] = useState("");

    const handleSubmit = async () => {
        if (!guestName || !dateRange?.from || !dateRange?.to) return;

        await actions.createLead.mutateAsync({
            property_id: selectedPropertyId!,
            status: 'new',
            guest_name: guestName,
            guest_phone: guestPhone,
            guest_email: null,
            check_in_date: dateRange.from.toISOString(),
            check_out_date: dateRange.to.toISOString(),
            adults,
            children: childrenCount,
            notes,
            source: 'manual_mobile',
            channel: 'direct',
            assigned_to: null
        });

        setOpen(false);
        setGuestName("");
        setGuestPhone("");
        setNotes("");
        setAdults(2);
        setChildrenCount(0);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary hover:bg-primary/10">
                        <UserPlus className="h-4 w-4" /> Novo Lead
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[22px] min-h-[85vh] p-6 overflow-y-auto max-w-md mx-auto">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-left text-lg font-bold flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Nova Oportunidade
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-5 pb-10">
                    <div className="space-y-2">
                        <Label>Hóspede</Label>
                        <Input
                            placeholder="Nome completo"
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Contato (WhatsApp)</Label>
                        <Input
                            placeholder="(00) 00000-0000"
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100"
                            value={guestPhone}
                            onChange={e => setGuestPhone(e.target.value)}
                            type="tel"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Datas Pretendidas</Label>
                        <div className="bg-neutral-50 p-1 rounded-xl border border-neutral-100">
                            {/* @ts-ignore */}
                            <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Adultos</Label>
                            <div className="flex items-center bg-neutral-50 rounded-xl border border-neutral-100 h-12 px-3">
                                <Users className="h-4 w-4 text-neutral-400 mr-2" />
                                <Input
                                    type="number"
                                    min={1}
                                    className="border-none bg-transparent h-full p-0 focus-visible:ring-0"
                                    value={adults}
                                    onChange={e => setAdults(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Crianças</Label>
                            <div className="flex items-center bg-neutral-50 rounded-xl border border-neutral-100 h-12 px-3">
                                <Users className="h-4 w-4 text-neutral-400 mr-2" />
                                <Input
                                    type="number"
                                    min={0}
                                    className="border-none bg-transparent h-full p-0 focus-visible:ring-0"
                                    value={childrenCount}
                                    onChange={e => setChildrenCount(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            placeholder="Ex: Prefere andar alto, casal em lua de mel..."
                            className="min-h-[80px] rounded-xl bg-neutral-50 border-neutral-100 resize-none"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl text-base font-bold mt-4"
                        onClick={handleSubmit}
                        disabled={!guestName || !dateRange?.from || actions.createLead.isPending}
                    >
                        {actions.createLead.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Lead"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
