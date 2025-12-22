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
    CalendarCheck,
    PlusCircle,
    DollarSign,
    Wallet,
    BookOpen,
    Store,
    BarChart3,
    Package
} from "lucide-react";
import {
    MobileShell,
    MobileTopHeader
} from "@/components/mobile/MobileShell";
import {
    KpiGrid,
    KpiCard,
    ListRow,
    SectionTitleRow,
    CardContainer,
    HeroSection,
    QuickAccessCard
} from "@/components/mobile/MobileUI";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { ScrollArea } from "@/components/ui/scroll-area";

const MobileHome: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();

    const menuItems = [
        {
            title: "Pedidos Agora",
            subtitle: "Fila de produção em tempo real",
            icon: Package,
            iconColor: "text-blue-500",
            path: "/m/ops-now"
        },
        {
            title: "Novo Pedido",
            subtitle: "Lançar pedido de balcão/mesa",
            icon: PlusCircle,
            iconColor: "text-emerald-500",
            path: "/m/new-order"
        },
        {
            title: "Pagamentos",
            subtitle: "Confirmar Pix e caixa",
            icon: DollarSign,
            iconColor: "text-amber-500",
            path: "/m/payments"
        },
        {
            title: "Controle de Caixa",
            subtitle: "Reforços, sangrias e saldo",
            icon: Wallet,
            iconColor: "text-teal-600",
            path: "/m/cash-control"
        },
        {
            title: "Cardápio",
            subtitle: "Pausar/Ativar produtos",
            icon: BookOpen,
            iconColor: "text-orange-500",
            path: "/m/menu"
        },
        {
            title: "Status Loja",
            subtitle: "Abrir ou fechar operação",
            icon: Store,
            iconColor: "text-purple-500",
            path: "/m/status"
        },
        {
            title: "Resumo",
            subtitle: "Métricas do dia até agora",
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
                    <KpiCard label="Pedidos Hoje" value="0" unit="vol" />
                    <KpiCard label="Faturamento" value="0" unit="R$" />
                </KpiGrid>

                <SectionTitleRow title="Acesso Rápido" />

                <div className="space-y-3">
                    {menuItems.map((item, idx) => (
                        <QuickAccessCard
                            key={idx}
                            title={item.title}
                            subtitle={item.subtitle}
                            icon={item.icon}
                            iconColor={item.iconColor}
                            onClick={() => navigate(item.path)}
                        />
                    ))}
                </div>
            </div>
        </MobileShell>
    );
};

export default MobileHome;
