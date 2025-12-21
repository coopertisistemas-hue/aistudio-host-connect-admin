import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Bed,
    Brush,
    Construction,
    Utensils,
    TrendingUp,
    BarChart,
    Bell,
    User,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    CalendarCheck
} from "lucide-react";
import {
    MobileShell,
    MobileTopHeader
} from "@/components/mobile/MobileShell";
import {
    KpiGrid,
    KpiCard,
    QuickAccessCard,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { ScrollArea } from "@/components/ui/scroll-area";

const MobileHome: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();

    const menuItems = [
        {
            title: "Operação Agora",
            subtitle: "Painel operacional do dia",
            icon: LayoutDashboard,
            iconColor: "text-blue-500",
            path: "/m/ops-now",
            badge: 3
        },
        {
            title: "Quartos",
            subtitle: "Status de ocupação e limpeza",
            icon: Bed,
            iconColor: "text-emerald-500",
            path: "/m/rooms"
        },
        {
            title: "Governança",
            subtitle: "Tarefas de limpeza e vistorias",
            icon: Brush,
            iconColor: "text-purple-500",
            path: "/m/housekeeping",
            badge: "8"
        },
        {
            title: "Manutenção",
            subtitle: "Demandas e preventivas",
            icon: Construction,
            iconColor: "text-orange-500",
            path: "/m/maintenance"
        },
        {
            title: "Célula de Reservas",
            subtitle: "Leads e pipeline de vendas",
            icon: TrendingUp,
            iconColor: "text-rose-500",
            path: "/m/reservations",
            badge: "NOVO"
        },
        {
            title: "Resumo Executivo",
            subtitle: "KPIs e faturamento hoje",
            icon: BarChart,
            iconColor: "text-blue-600",
            path: "/m/summary"
        }
    ];

    return (
        <MobileShell>
            <MobileTopHeader />

            <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="pb-8">
                    <SectionTitleRow title="Visão Geral de Hoje" />
                    <KpiGrid>
                        <KpiCard label="Check-ins" value="12" icon={CalendarCheck} />
                        <KpiCard label="Check-outs" value="08" icon={Clock} />
                        <KpiCard label="Pendentes" value="04" icon={CheckCircle2} />
                        <KpiCard label="Ocorrências" value="02" icon={Bell} />
                    </KpiGrid>

                    <SectionTitleRow title="Acesso Rápido" />
                    <div className="px-5">
                        {menuItems.map((item, idx) => (
                            <QuickAccessCard
                                key={idx}
                                title={item.title}
                                subtitle={item.subtitle}
                                icon={item.icon}
                                iconColor={item.iconColor}
                                badge={item.badge}
                                onClick={() => navigate(item.path)}
                            />
                        ))}
                    </div>

                    <div className="mt-12 text-center px-8">
                        <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                            Host Connect v2.4.0 • Edição Mobile
                        </p>
                        <p className="text-[10px] text-neutral-300 mt-1 uppercase">
                            Sistema Operacional de Hotelaria
                        </p>
                    </div>
                </div>
            </ScrollArea>
        </MobileShell>
    );
};

export default MobileHome;
