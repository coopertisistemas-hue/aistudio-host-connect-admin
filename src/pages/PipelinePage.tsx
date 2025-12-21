import { useState } from "react";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useLeads, LeadStatus } from "@/hooks/useLeads";
import { OperationPageTemplate } from "@/components/OperationPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Trophy,
    Clock,
    MessageSquare,
    Plus,
    LayoutGrid,
    List,
    ChevronRight,
    TrendingUp,
    Filter,
    Phone
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { KpiCard } from "@/components/KpiCard";
import { Link } from "react-router-dom";
import LeadDialog from "@/components/LeadDialog";

const STATUS_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'new', label: 'Novo Contato', color: 'bg-blue-500' },
    { id: 'contacted', label: 'Em Atendimento', color: 'bg-orange-500' },
    { id: 'quoted', label: 'Cotado', color: 'bg-purple-500' },
    { id: 'negotiation', label: 'Negociação', color: 'bg-indigo-500' },
    { id: 'won', label: 'Reservado', color: 'bg-green-500' },
    { id: 'lost', label: 'Perdido', color: 'bg-red-500' },
];

const PipelinePage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { leads, isLoading, updateLeadStatus } = useLeads(selectedPropertyId!);
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

    if (isLoading) return <DataTableSkeleton />;

    const wonLeads = leads.filter(l => l.status === 'won').length;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    return (
        <OperationPageTemplate
            title="Funil de Reservas"
            subtitle="Gestão de leads e conversão"
            headerIcon={<TrendingUp className="h-6 w-6 text-primary" />}
            kpiSection={
                <>
                    <KpiCard
                        title="Novos Leads"
                        value={leads.filter(l => l.status === 'new').length.toString()}
                        icon={<Clock className="h-4 w-4 text-blue-500" />}
                        trend={{ value: "+12%", isPositive: true }}
                    />
                    <KpiCard
                        title="Em Negociação"
                        value={leads.filter(l => ['contacted', 'quoted', 'negotiation'].includes(l.status)).length.toString()}
                        icon={<MessageSquare className="h-4 w-4 text-orange-500" />}
                    />
                    <KpiCard
                        title="Taxa de Conversão"
                        value={`${conversionRate.toFixed(1)}%`}
                        icon={<Trophy className="h-4 w-4 text-green-500" />}
                        trend={{ value: "+2.4%", isPositive: true }}
                    />
                </>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'kanban' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('kanban')}
                            className="gap-2"
                        >
                            <LayoutGrid className="h-4 w-4" /> Kanban
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="gap-2"
                        >
                            <List className="h-4 w-4" /> Tabela
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="h-4 w-4" /> Filtros
                        </Button>
                        <Button size="sm" className="gap-2" onClick={() => setIsLeadDialogOpen(true)}>
                            <Plus className="h-4 w-4" /> Novo Lead
                        </Button>
                    </div>
                </div>

                <LeadDialog
                    open={isLeadDialogOpen}
                    onOpenChange={setIsLeadDialogOpen}
                    propertyId={selectedPropertyId!}
                />

                {viewMode === 'kanban' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
                        {STATUS_COLUMNS.map((col) => {
                            const colLeads = leads.filter(l => l.status === col.id);
                            return (
                                <div key={col.id} className="flex flex-col gap-4 min-w-[250px]">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${col.color}`} />
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px]">{colLeads.length}</Badge>
                                    </div>

                                    <div className="flex flex-col gap-3 min-h-[500px] rounded-xl bg-muted/30 p-2 border border-dashed border-muted">
                                        {colLeads.map((lead) => (
                                            <Link to={`/reservations/leads/${lead.id}`} key={lead.id}>
                                                <Card className="border-none shadow-sm hover:ring-2 ring-primary/20 transition-all cursor-pointer group">
                                                    <CardContent className="p-3 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-xs font-bold truncate pr-4">{lead.guest_name}</h4>
                                                            <span className="text-[8px] bg-primary/5 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                                                {lead.source}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {lead.check_in_date ? format(new Date(lead.check_in_date), "dd/MM") : 'N/A'} - {lead.check_out_date ? format(new Date(lead.check_out_date), "dd/MM") : 'N/A'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {lead.guest_phone || 'N/A'}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-2 border-t border-dashed">
                                                            <div className="flex -space-x-1.5">
                                                                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-bold">U</div>
                                                            </div>
                                                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                        {colLeads.length === 0 && (
                                            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-muted-foreground italic py-10 opacity-30">
                                                Vazio
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-0">
                            {/* Simplified table placeholder */}
                            <div className="p-10 text-center text-sm text-muted-foreground">
                                Tabela detalhada de leads em construção.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </OperationPageTemplate>
    );
};

export default PipelinePage;
