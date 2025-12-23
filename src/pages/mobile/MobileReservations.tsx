import React, { useState } from "react";
import {
    CalendarDays,
    TrendingUp,
    UserPlus,
    Users,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Phone,
    MoreHorizontal
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { Button } from "@/components/ui/button";
import { useMobileReservations } from "@/hooks/useMobileReservations";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreateLeadSheet } from "@/components/mobile/CreateLeadSheet";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ReservationLead } from "@/hooks/useLeads";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MobileReservations: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { stats, pipeline, isLoading, actions } = useMobileReservations(selectedPropertyId);

    // Quick Actions Sheet State
    const [selectedLead, setSelectedLead] = useState<ReservationLead | null>(null);
    const [actionNote, setActionNote] = useState("");

    const handleQuickAction = async (action: 'contacted' | 'won' | 'lost') => {
        if (!selectedLead) return;
        await actions.updateLeadStatus.mutateAsync({
            id: selectedLead.id,
            status: action,
            oldStatus: selectedLead.status
        });
        setSelectedLead(null);
    };

    const renderLeadCard = (lead: ReservationLead) => (
        <CardContainer
            key={lead.id}
            className="p-4 border-none shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-all"
            onClick={() => setSelectedLead(lead)}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-sm font-bold text-[#1A1C1E]">{lead.guest_name}</h4>
                    <span className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {lead.check_in_date ? format(new Date(lead.check_in_date), "dd/MM") : "?"} - {lead.check_out_date ? format(new Date(lead.check_out_date), "dd/MM") : "?"}
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-lg">
                    <Users className="h-3 w-3 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-600">{(lead.adults || 0) + (lead.children || 0)}</span>
                </div>
            </div>
            {lead.guest_phone && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Phone className="h-3 w-3" /> {lead.guest_phone}
                </div>
            )}
        </CardContainer>
    );

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Célula de Reservas"
                    subtitle="Disponibilidade e Pipeline"
                    rightAction={<CreateLeadSheet />}
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-10 space-y-6">

                {/* Availability Header */}
                <CardContainer className="p-4 bg-gradient-to-br from-[#1A1C1E] to-[#2C3E50] text-white border-none shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-bold opacity-70 uppercase tracking-widest">Ocupação Hoje</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-3xl font-bold">{stats.occupancyRate.toFixed(0)}%</span>
                                <span className="text-xs opacity-70">bloqueado</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                <span className="block text-xl font-bold">{stats.totalRooms - stats.occupiedRooms}</span>
                                <span className="text-[10px] opacity-70 uppercase font-bold">Vagos</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-emerald-400 transition-all duration-1000"
                            style={{ width: `${stats.occupancyRate}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                            <span className="text-[10px] opacity-60 uppercase block mb-1">Chegadas</span>
                            <span className="text-lg font-bold">{stats.arrivalsToday}</span>
                        </div>
                        <div>
                            <span className="text-[10px] opacity-60 uppercase block mb-1">Saídas</span>
                            <span className="text-lg font-bold">{stats.departuresToday}</span>
                        </div>
                    </div>
                </CardContainer>

                {/* Pipeline Board */}
                <div className="space-y-6">

                    {/* NEW */}
                    <div>
                        <SectionTitleRow
                            title="Novos Leads"
                            rightElement={<span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{pipeline.new.length}</span>}
                        />
                        {pipeline.new.length > 0 ? (
                            <div className="space-y-3">
                                {pipeline.new.map(renderLeadCard)}
                            </div>
                        ) : (
                            <div className="p-4 text-center border border-dashed border-neutral-200 rounded-xl">
                                <span className="text-xs text-neutral-400">Nenhum novo lead.</span>
                            </div>
                        )}
                    </div>

                    {/* NEGOTIATION */}
                    <div>
                        <SectionTitleRow
                            title="Em Tratativa"
                            rightElement={<span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{pipeline.negotiation.length}</span>}
                        />
                        {pipeline.negotiation.length > 0 ? (
                            <div className="space-y-3">
                                {pipeline.negotiation.map(renderLeadCard)}
                            </div>
                        ) : (
                            <div className="p-4 text-center border border-dashed border-neutral-200 rounded-xl">
                                <span className="text-xs text-neutral-400">Nenhum lead em negociação.</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Quick Action Sheet */}
            <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
                <SheetContent side="bottom" className="rounded-t-[22px] min-h-[40vh] p-6 pb-10 max-w-md mx-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="text-left flex flex-col">
                            <span className="text-xs font-normal text-neutral-400 uppercase">Gerenciar Lead</span>
                            <span className="text-xl font-bold">{selectedLead?.guest_name}</span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col gap-2 rounded-xl border-neutral-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                            onClick={() => handleQuickAction('contacted')}
                        >
                            <MessageSquare className="h-6 w-6 text-blue-500" />
                            <span className="text-xs font-bold">Contatado</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col gap-2 rounded-xl border-neutral-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                            onClick={() => handleQuickAction('won')}
                        >
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            <span className="text-xs font-bold">Confirmar</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col gap-2 rounded-xl border-neutral-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                            onClick={() => handleQuickAction('lost')}
                        >
                            <XCircle className="h-6 w-6 text-rose-500" />
                            <span className="text-xs font-bold">Perdido</span>
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Nota rápida (Opcional)</Label>
                        <Textarea
                            placeholder="Adicionar observação..."
                            className="bg-neutral-50 border-neutral-100 resize-none"
                            value={actionNote}
                            onChange={e => setActionNote(e.target.value)}
                        />
                    </div>
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

export default MobileReservations;
