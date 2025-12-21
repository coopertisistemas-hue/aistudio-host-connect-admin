import { useState } from "react";
import { useDemands, MaintenanceDemand } from "@/hooks/useDemands";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { OperationPageTemplate } from "@/components/OperationPageTemplate";
import { DemandCard } from "@/components/DemandCard";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Settings2 } from "lucide-react";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { DemandDialog } from "@/components/DemandDialog";

const DemandsPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { demands, isLoading, createDemand } = useDemands(selectedPropertyId);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleCreateDemand = async (data: any) => {
        const room_id = data.room_id === 'none' ? null : data.room_id;
        await createDemand.mutateAsync({ ...data, room_id });
        setDialogOpen(false);
    };

    const filteredDemands = (demands || []).filter((demand) => {
        const matchesSearch = demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.rooms?.room_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || demand.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const kpis = {
        open: (demands || []).filter(d => d.status === 'todo').length,
        critical: (demands || []).filter(d => d.priority === 'critical' && d.status !== 'done').length,
        inProgress: (demands || []).filter(d => d.status === 'in-progress').length,
    };

    const statuses = [
        { label: "Todas", value: "all" },
        { label: "Abertas", value: "todo" },
        { label: "Em Execução", value: "in-progress" },
        { label: "Aguardando", value: "waiting" },
        { label: "Concluídas", value: "done" },
    ];

    return (
        <OperationPageTemplate
            title="Manutenção"
            subtitle="Controle de demandas e reparos"
            headerActions={
                <Button
                    variant="hero"
                    size="sm"
                    className="h-9"
                    onClick={() => setDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Demanda
                </Button>
            }
            kpiSection={
                <>
                    <KpiCard label="Abertas" value={kpis.open} variant="amber" />
                    <KpiCard label="Críticas" value={kpis.critical} variant="rose" />
                    <KpiCard label="Em Execução" value={kpis.inProgress} variant="blue" />
                </>
            }
            searchPlaceholder="Buscar por título ou quarto..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filtersSection={
                statuses.map((s) => (
                    <Badge
                        key={s.value}
                        variant={statusFilter === s.value ? "default" : "secondary"}
                        className={`cursor-pointer px-4 py-1.5 text-xs font-medium transition-all ${statusFilter === s.value ? "shadow-md scale-105" : "hover:bg-secondary/80"
                            }`}
                        onClick={() => setStatusFilter(s.value)}
                    >
                        {s.label}
                    </Badge>
                ))
            }
        >
            {isLoading ? (
                <DataTableSkeleton />
            ) : filteredDemands.length === 0 ? (
                <div className="py-20 text-center bg-card rounded-xl border border-dashed flex flex-col items-center">
                    <Settings2 className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground text-sm font-medium">Nenhuma demanda encontrada.</p>
                    <p className="text-xs text-muted-foreground mt-1">Crie uma nova demanda para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredDemands.map((demand) => (
                        <DemandCard key={demand.id} demand={demand} />
                    ))}
                </div>
            )}

            <DemandDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleCreateDemand}
                isLoading={createDemand.isPending}
                propertyId={selectedPropertyId}
            />
        </OperationPageTemplate>
    );
};

export default DemandsPage;
