import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Bed,
    Brush,
    Construction,
    Calendar,
    BarChart3,
    PlusCircle,
    DollarSign,
    Wallet,
    BookOpen,
    Store,
    LayoutDashboard,
    WashingMachine,
    UtensilsCrossed
} from "lucide-react";
import {
    MobileShell,
    MobileTopHeader
} from "@/components/mobile/MobileShell";
import {
    KpiGrid,
    KpiCard,
    CardContainer,
    HeroSection,
    QuickAccessCard,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useHousekeeping } from "@/hooks/useHousekeeping";
import { useDemands } from "@/hooks/useDemands";
import { useArrivals } from "@/hooks/useArrivals";
import { useDepartures } from "@/hooks/useDepartures";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

const MobileHome: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { selectedPropertyId } = useSelectedProperty();

    // Auto-refresh logic: Initial delay + Periodic interval + Background pause
    useEffect(() => {
        // Delay inicial: 15s
        const initialTimer = setTimeout(() => {
            if (document.visibilityState === 'visible') {
                queryClient.invalidateQueries();
            }
        }, 15000);

        // Intervalo: 30s
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                queryClient.invalidateQueries();
            }
        }, 30000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [queryClient]);

    // Fetch data for KPIs
    const { tasks: housekeepingTasks } = useHousekeeping(selectedPropertyId, user?.id);
    const { demands: maintenanceDemands } = useDemands(selectedPropertyId);
    const { arrivals } = useArrivals(selectedPropertyId);
    const { departures } = useDepartures(selectedPropertyId);
    const { unreadCount: occurrences } = useNotifications();

    const pendingHousekeeping = housekeepingTasks?.filter(t => t.status !== 'completed').length || 0;
    const pendingMaintenance = maintenanceDemands?.filter(d => d.status !== 'done').length || 0;
    const totalPending = pendingHousekeeping + pendingMaintenance;

    // !!! DO NOT CHANGE ROUTES/HANDLERS - Official Navigation Contract (see docs/mobile-only/ops-home-route-map.md) !!!
    const menuItems = [
        {
            title: "Operação Agora",
            subtitle: "Pedidos e fluxo em tempo real",
            icon: Package,
            iconColor: "text-blue-500",
            path: "/m/ops-now",
            badge: undefined // Add logic if needed
        },
        {
            title: "Quartos",
            subtitle: "Mapa de ocupação e status",
            icon: Bed,
            iconColor: "text-indigo-500",
            path: "/m/rooms"
        },
        {
            title: "Governança",
            subtitle: "Limpeza e arrumação",
            icon: Brush,
            iconColor: "text-amber-500",
            path: "/m/housekeeping",
            badge: pendingHousekeeping > 0 ? pendingHousekeeping : undefined
        },
        {
            title: "Manutenção",
            subtitle: "Reparos e preventivas",
            icon: Construction,
            iconColor: "text-rose-500",
            path: "/operation/demands",
            badge: pendingMaintenance > 0 ? pendingMaintenance : undefined
        },
        {
            title: "Lavanderia",
            subtitle: "Fila e status de enxoval",
            icon: WashingMachine,
            iconColor: "text-cyan-600",
            path: "/m/laundry",
            badge: "0"
        },
        {
            title: "Copa",
            subtitle: "Tarefas e pendências",
            icon: UtensilsCrossed,
            iconColor: "text-orange-500",
            path: "/m/pantry",
            badge: "0"
        },
        {
            title: "Célula de Reservas",
            subtitle: "Vendas e disponibilidade",
            icon: Calendar,
            iconColor: "text-emerald-500",
            path: "/reservations/pipeline",
            badge: "Novo"
        },
        {
            title: "Financeiro",
            subtitle: "Caixa e fechamentos",
            icon: Wallet,
            iconColor: "text-emerald-600",
            path: "/m/financial",
            badge: undefined
        },
        {
            title: "Resumo Executivo",
            subtitle: "Métricas e performance",
            icon: BarChart3,
            iconColor: "text-slate-500",
            path: "/m/summary"
        }
    ];

    return (
        <MobileShell header={<MobileTopHeader />}>
            <div className="px-[var(--ui-spacing-page,20px)] pb-8">
                <HeroSection />

                <KpiGrid>
                    <KpiCard label="Check-ins" value={arrivals?.length || 0} unit="hoje" />
                    <KpiCard label="Check-outs" value={departures?.length || 0} unit="hoje" />
                    <KpiCard label="Pendências" value={totalPending} unit="atividades" />
                    <KpiCard label="Ocorrências" value={occurrences} unit="registros" />
                </KpiGrid>

                <SectionTitleRow title="Acesso Rápido" />

                <div className="space-y-4">
                    {menuItems.map((item, idx) => (
                        <QuickAccessCard
                            key={idx}
                            title={item.title}
                            subtitle={item.subtitle}
                            icon={item.icon}
                            iconColor={item.iconColor}
                            onClick={() => navigate(item.path)}
                            badge={item.badge}
                        />
                    ))}
                </div>
            </div>
        </MobileShell>
    );
};

export default MobileHome;
