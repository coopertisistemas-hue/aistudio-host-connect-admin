import React from "react";
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Calendar,
    Users,
    TrendingUp
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { useMobileExecutive } from "@/hooks/useMobileExecutive";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const MobileExecutive: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { health, kpis, isLoading } = useMobileExecutive(selectedPropertyId);

    // Dynamic Traffic Light Colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-emerald-500';
            case 'warning': return 'bg-amber-500';
            case 'critical': return 'bg-rose-500';
            default: return 'bg-neutral-300';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'healthy': return 'Operação Saudável';
            case 'warning': return 'Atenção Necessária';
            case 'critical': return 'Ação Imediata Requerida';
            default: return 'Carregando...';
        }
    };

    if (isLoading) {
        return (
            <MobileShell header={<MobilePageHeader title="Resumo Executivo" />}>
                <div className="p-5 space-y-4">
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            </MobileShell>
        );
    }

    return (
        <MobileShell header={<MobilePageHeader title="Resumo Executivo" subtitle="Visão Geral do Dia" />}>
            <div className="px-[var(--ui-spacing-page,20px)] pb-24 space-y-6">

                {/* Main Health Card */}
                <CardContainer className={cn(
                    "p-6 text-white border-none shadow-lg relative overflow-hidden",
                    getStatusColor(health.status)
                )}>
                    {/* Background decoration */}
                    <Activity className="absolute -right-6 -bottom-6 h-32 w-32 opacity-20 rotate-12" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div className="px-2.5 py-1 bg-white/20 rounded-full backdrop-blur-sm inline-flex items-center gap-1.5">
                                <Activity className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Status Operacional</span>
                            </div>
                            <span className="text-3xl font-bold">{health.score}</span>
                        </div>

                        <h2 className="text-2xl font-bold mb-1 leading-tight">{getStatusText(health.status)}</h2>
                        <p className="text-sm opacity-90 font-medium">Pontuação diária baseada em pendências.</p>
                    </div>
                </CardContainer>

                {/* Bottlenecks / Alerts */}
                {health.bottlenecks.length > 0 && (
                    <div className="space-y-3">
                        <SectionTitleRow title="Pontos de Atenção" rightElement={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
                        {health.bottlenecks.map((alert, idx) => (
                            <div key={idx} className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <span className="text-sm font-medium text-amber-900">{alert}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Movement Stats */}
                <div>
                    <SectionTitleRow title="Movimentação" />
                    <div className="grid grid-cols-2 gap-3">
                        <CardContainer className="p-4 border-none shadow-sm flex flex-col gap-2 bg-blue-50/50">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase opacity-70">Check-ins</span>
                            </div>
                            <span className="text-2xl font-bold text-neutral-800">{kpis.movements.arrivals}</span>
                        </CardContainer>
                        <CardContainer className="p-4 border-none shadow-sm flex flex-col gap-2 bg-purple-50/50">
                            <div className="flex items-center gap-2 text-purple-600">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase opacity-70">Check-outs</span>
                            </div>
                            <span className="text-2xl font-bold text-neutral-800">{kpis.movements.departures}</span>
                        </CardContainer>
                    </div>
                </div>

                {/* Operations Stats */}
                <div>
                    <SectionTitleRow title="Backlog Operacional" />
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white border p-3 rounded-xl text-center">
                            <span className="block text-2xl font-bold text-rose-600 mb-1">{kpis.operations.critical}</span>
                            <span className="text-[10px] uppercase font-bold text-neutral-400">Críticas</span>
                        </div>
                        <div className="bg-white border p-3 rounded-xl text-center">
                            <span className="block text-2xl font-bold text-amber-600 mb-1">{kpis.operations.occurrences}</span>
                            <span className="text-[10px] uppercase font-bold text-neutral-400">Ocorrências</span>
                        </div>
                        <div className="bg-white border p-3 rounded-xl text-center">
                            <span className="block text-2xl font-bold text-emerald-600 mb-1">{kpis.sales.newLeads}</span>
                            <span className="text-[10px] uppercase font-bold text-neutral-400">Novos Leads</span>
                        </div>
                    </div>
                </div>

            </div>
        </MobileShell>
    );
};

export default MobileExecutive;
