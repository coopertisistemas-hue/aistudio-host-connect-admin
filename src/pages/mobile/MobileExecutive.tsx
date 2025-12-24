import React, { useState } from "react";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Users,
    TrendingUp,
    Clock,
    Bed,
    Briefcase,
    Zap,
    WashingMachine,
    UtensilsCrossed,
    Wallet,
    ChevronRight,
    AlertCircle,
    RefreshCw,
    Lightbulb
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow,
    PremiumSkeleton
} from "@/components/mobile/MobileUI";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { useMobileExecutive, MobileExecutiveAlert } from "@/hooks/useMobileExecutive";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MobileExecutive: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId, user } = useSelectedProperty();
    const { kpis, alerts, areaStatuses, recommendedActions, shift, isLoading, refresh } = useMobileExecutive(selectedPropertyId, user?.id);
    const [selectedAlert, setSelectedAlert] = useState<MobileExecutiveAlert | null>(null);

    if (isLoading) {
        return (
            <MobileShell header={<MobilePageHeader title="Resumo Executivo" />}>
                <div className="p-5 space-y-4">
                    <PremiumSkeleton className="h-48 w-full" />
                    <PremiumSkeleton className="h-32 w-full" />
                    <div className="grid grid-cols-2 gap-3">
                        <PremiumSkeleton className="h-24 w-full" />
                        <PremiumSkeleton className="h-24 w-full" />
                    </div>
                </div>
            </MobileShell>
        );
    }

    return (
        <MobileShell header={<MobilePageHeader title="Resumo Executivo" subtitle="Visão Geral do Dia" />}>
            <div className="px-[var(--ui-spacing-page,20px)] pb-24 space-y-6">

                {/* HERO SECTION */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-[24px] p-5 shadow-xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -ml-5 -mb-5" />

                    <div className="relative z-10">
                        {/* Header Chips */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/5">
                                <Calendar className="h-3 w-3" />
                                Hoje
                            </span>
                            <span className="bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {shift}
                            </span>
                            <button
                                onClick={() => refresh && refresh()}
                                className="ml-auto bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white/80 border border-white/5 flex items-center gap-1.5 active:bg-white/10"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Atualizar
                            </button>
                        </div>

                        {/* KPIs Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Occupancy */}
                            <div className="flex flex-col gap-1">
                                <span className="text-white/60 text-[11px] font-bold uppercase tracking-wider">Ocupação</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold tracking-tight">{kpis.occupancy}%</span>
                                </div>
                                <div className="w-full bg-white/10 h-1 rounded-full mt-1">
                                    <div className="bg-emerald-400 h-1 rounded-full transition-all duration-1000" style={{ width: `${kpis.occupancy}%` }} />
                                </div>
                            </div>

                            {/* Critical */}
                            <div className="flex flex-col gap-1">
                                <span className="text-white/60 text-[11px] font-bold uppercase tracking-wider">Críticos</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-3xl font-bold tracking-tight",
                                        kpis.criticalOps > 0 ? "text-rose-400" : "text-white"
                                    )}>
                                        {kpis.criticalOps}
                                    </span>
                                    {kpis.criticalOps > 0 && <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />}
                                </div>
                            </div>

                            {/* Check-ins */}
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1 text-white/70">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase">Check-ins</span>
                                </div>
                                <span className="text-xl font-bold">{kpis.checkIns}</span>
                            </div>

                            {/* Check-outs */}
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-1 text-white/70">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase">Check-outs</span>
                                </div>
                                <span className="text-xl font-bold">{kpis.checkOuts}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ALERTS SECTION */}
                {alerts.length > 0 ? (
                    <div>
                        <SectionTitleRow
                            title="Atenção Prioritária"
                            rightElement={<div className="bg-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-600">{alerts.length}</div>}
                        />
                        <div className="flex flex-col gap-3">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => alert.details ? setSelectedAlert(alert) : navigate(alert.actionPath)}
                                    className="bg-white border border-neutral-100 p-4 rounded-2xl shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform cursor-pointer"
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                        alert.severity === 'critical' ? "bg-rose-50 text-rose-600" :
                                            alert.severity === 'warning' ? "bg-amber-50 text-amber-600" :
                                                "bg-blue-50 text-blue-600"
                                    )}>
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-neutral-800 leading-tight mb-0.5">{alert.title}</h4>
                                        <p className="text-xs text-neutral-500 font-medium">{alert.value}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-primary bg-primary/5 rounded-full hover:bg-primary/10">
                                        {alert.actionLabel}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <CardContainer className="py-6 flex flex-col items-center justify-center text-center bg-emerald-50/50 border-emerald-100/50 border-dashed">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                        <p className="text-sm font-bold text-emerald-800">Tudo certo por aqui!</p>
                        <p className="text-xs text-emerald-600/70">Sem alertas críticos no momento.</p>
                    </CardContainer>
                )}

                {/* RECOMMENDED ACTIONS (SECTION D) */}
                {recommendedActions && recommendedActions.length > 0 && (
                    <div>
                        <SectionTitleRow title="Ações Recomendadas" rightElement={<Lightbulb className="h-4 w-4 text-amber-500" />} />
                        <div className="grid grid-cols-1 gap-2">
                            {recommendedActions.map((action) => (
                                <div
                                    key={action.id}
                                    onClick={() => action.path && navigate(action.path)}
                                    className="bg-white p-3.5 rounded-xl border border-neutral-100 shadow-sm flex items-center justify-between active:bg-neutral-50 cursor-pointer"
                                >
                                    <span className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {action.title}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-neutral-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* GRID STATUS */}
                <div>
                    <SectionTitleRow title="Visão por Área" />
                    <div className="grid grid-cols-2 gap-3">
                        {areaStatuses.map((area) => (
                            <div
                                key={area.id}
                                onClick={() => navigate(area.path)}
                                className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="absolute top-3 right-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        area.status === 'critical' ? "bg-rose-500 animate-pulse" :
                                            area.status === 'attention' ? "bg-amber-500" :
                                                area.status === 'ok' ? "bg-emerald-500" : "bg-neutral-300"
                                    )} />
                                </div>

                                <AreaIcon id={area.id} className="h-6 w-6 text-neutral-600 mb-3" />

                                <h3 className="text-sm font-bold text-neutral-800 mb-0.5">{area.name}</h3>
                                <p className={cn(
                                    "text-[11px] font-medium leading-tight",
                                    area.status === 'critical' ? "text-rose-600" :
                                        area.status === 'attention' ? "text-amber-600" :
                                            "text-neutral-500"
                                )}>
                                    {area.summary}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* DETAIL MODAL (Bottom Sheet) */}
            <Sheet open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px] p-0 max-h-[85vh]">
                    <SheetHeader className="p-6 pb-2 text-left">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            {selectedAlert?.title}
                        </SheetTitle>
                        <SheetDescription>
                            Detalhes rápidos para tomada de decisão.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="p-6 pt-2 space-y-4 overflow-y-auto max-h-[60vh]">
                        {selectedAlert?.details && selectedAlert.details.length > 0 ? (
                            <div className="space-y-3">
                                {selectedAlert.details.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-neutral-800">{item.name || item.room}</p>
                                            <div className="flex gap-2 text-xs text-neutral-500 mt-0.5">
                                                {item.room && <span>Quarto {item.room}</span>}
                                                {item.days && <span>• {item.days} dias</span>}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-neutral-300" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-neutral-400">
                                <p className="text-sm">Nenhum detalhe adicional disponível.</p>
                            </div>
                        )}

                        <Button
                            className="w-full rounded-xl h-12 font-bold text-md mt-4"
                            onClick={() => {
                                if (selectedAlert?.actionPath) navigate(selectedAlert.actionPath);
                                setSelectedAlert(null);
                            }}
                        >
                            {selectedAlert?.actionLabel || "Abrir Módulo"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

// Helper for dynamic icons
const AreaIcon = ({ id, className }: { id: string, className?: string }) => {
    switch (id) {
        case 'ops_now': return <Zap className={className} />;
        case 'rooms': return <Bed className={className} />;
        case 'housekeeping': return <Briefcase className={className} />; // Or Brush if imported
        case 'maintenance': return <Activity className={className} />;
        case 'laundry': return <WashingMachine className={className} />;
        case 'pantry': return <UtensilsCrossed className={className} />;
        case 'financial': return <Wallet className={className} />;
        case 'reservations': return <Calendar className={className} />;
        default: return <Activity className={className} />;
    }
}

export default MobileExecutive;
