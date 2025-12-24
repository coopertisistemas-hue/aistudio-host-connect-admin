import { useOperationsNow } from "./useOperationsNow";
import { useMobileReservations } from "./useMobileReservations";
import { useHousekeeping } from "./useHousekeeping";
import { useDemands } from "./useDemands";
import { useQueryClient } from "@tanstack/react-query";

export interface MobileExecutiveAlert {
    id: string;
    type: 'long_stay' | 'monthly' | 'financial' | 'ops' | 'maintenance';
    title: string;
    value?: string | number;
    actionLabel: string;
    actionPath: string;
    severity: 'info' | 'warning' | 'critical';
    details?: any[]; // For the modal
}

export interface AreaStatus {
    id: string;
    name: string;
    status: 'ok' | 'attention' | 'critical' | 'no_data';
    summary: string;
    path: string;
}

export interface RecommendedAction {
    id: string;
    title: string;
    path: string;
}

export const useMobileExecutive = (propertyId?: string, userId?: string) => {
    const queryClient = useQueryClient();

    // 1. Fetch data from existing operational hooks
    const { summary: opsSummary, isLoading: opsLoading } = useOperationsNow(propertyId);
    const { stats: resStats, isLoading: resLoading } = useMobileReservations(propertyId);
    const { tasks: housekeepingTasks, isLoading: hkLoading } = useHousekeeping(propertyId, userId);
    const { demands: maintenanceDemands, isLoading: maintLoading } = useDemands(propertyId);

    const refresh = () => {
        queryClient.invalidateQueries();
    };

    // 2. Aggregate Data

    // --- Time / Shift ---
    const now = new Date();
    const hour = now.getHours();
    let currentShift = 'Manhã';
    if (hour >= 14 && hour < 22) currentShift = 'Tarde';
    if (hour >= 22 || hour < 6) currentShift = 'Noite';

    // --- KPIs (Hero) ---
    const occupancy = resStats?.occupancyRate || 0;
    const checkIns = resStats?.arrivalsToday || 0; // Using arrivalsToday as proxy for check-ins needed/done
    const checkOuts = resStats?.departuresToday || 0;
    const criticalOps = opsSummary?.criticalTasks?.length || 0;

    // --- Alerts Generation (Mock + Real) ---
    const alerts: MobileExecutiveAlert[] = [];

    // 1. Long Stays (Mock)
    const mockLongStays = [
        { name: 'Sr. João Silva', room: '101', days: 12 },
        { name: 'Maria Oliveira', room: '205', days: 8 }
    ];
    if (mockLongStays.length > 0) {
        alerts.push({
            id: 'long_stay',
            type: 'long_stay',
            title: 'Hóspedes Longa Estadia',
            value: `${mockLongStays.length} ativos`,
            actionLabel: 'Ver Detalhes',
            actionPath: '', // Opens modal
            severity: 'info',
            details: mockLongStays
        });
    }

    // 2. Monthly (Mock)
    const mockMonthly = 3;
    if (mockMonthly > 0) {
        alerts.push({
            id: 'monthly',
            type: 'monthly',
            title: 'Mensalistas',
            value: `${mockMonthly} ativos`,
            actionLabel: 'Ver Lista',
            actionPath: '',
            severity: 'info'
        });
    }

    // 3. Financial (Mock)
    const pendingFinancial = true;
    if (pendingFinancial) {
        alerts.push({
            id: 'fin_pending',
            type: 'financial',
            title: 'Caixa Recepção',
            value: 'Sem fechamento',
            actionLabel: 'Financeiro',
            actionPath: '/m/financial',
            severity: 'critical'
        });
    }

    // 4. Operations (Real)
    if (criticalOps > 0) {
        alerts.push({
            id: 'ops_critical',
            type: 'ops',
            title: 'Operacional Crítico',
            value: `${criticalOps} itens`,
            actionLabel: 'Resolver',
            actionPath: '/m/ops-now',
            severity: 'critical'
        });
    }

    // --- Recommended Actions (Section D) ---
    // Extract top 3 actions based on priority
    const recommendedActions: RecommendedAction[] = [];

    if (mockLongStays.length > 0) {
        recommendedActions.push({ id: 'top_ls', title: `Ver ${mockLongStays.length} hóspedes +7 dias`, path: '' }); // Trigger modal logic via ID match if needed, or just generic path
    }
    if (pendingFinancial) {
        recommendedActions.push({ id: 'top_fin', title: 'Conferir caixa recepção', path: '/m/financial' });
    }
    const dirtyRooms = housekeepingTasks?.filter(t => t.status === 'pending').length || 0;
    if (dirtyRooms > 5) {
        recommendedActions.push({ id: 'top_hk', title: 'Revisar quartos sujos', path: '/m/housekeeping' });
    }
    // Fallback actions if few alerts
    if (recommendedActions.length < 3) {
        recommendedActions.push({ id: 'top_res', title: 'Verificar reservas de amanhã', path: '/m/reservations' });
    }


    // --- Area Status (Grid) ---
    const areaStatuses: AreaStatus[] = [];

    // Ops Now
    areaStatuses.push({
        id: 'ops_now',
        name: 'Operação Agora',
        status: criticalOps > 2 ? 'critical' : (criticalOps > 0 ? 'attention' : 'ok'),
        summary: `${criticalOps} críticos`,
        path: '/m/ops-now'
    });

    // Rooms (Mock status for overview)
    areaStatuses.push({
        id: 'rooms',
        name: 'Quartos',
        status: occupancy > 80 ? 'attention' : 'ok',
        summary: `${occupancy}% ocupação`,
        path: '/m/rooms'
    });

    // Housekeeping
    const pendingHk = housekeepingTasks?.filter(t => t.status !== 'completed').length || 0;
    areaStatuses.push({
        id: 'housekeeping',
        name: 'Governança',
        status: pendingHk > 5 ? 'attention' : 'ok',
        summary: `${pendingHk} pendentes`,
        path: '/m/housekeeping'
    });

    // Maintenance
    const pendingMaint = maintenanceDemands?.filter(d => d.status !== 'done').length || 0;
    areaStatuses.push({
        id: 'maintenance',
        name: 'Manutenção',
        status: pendingMaint > 2 ? 'attention' : 'ok',
        summary: `${pendingMaint} abertos`,
        path: '/m/maintenance'
    });

    // Laundry (Mock)
    areaStatuses.push({
        id: 'laundry',
        name: 'Lavanderia',
        status: 'ok',
        summary: 'Fluxo normal',
        path: '/m/laundry'
    });

    // Pantry (Mock)
    areaStatuses.push({
        id: 'pantry',
        name: 'Copa',
        status: 'no_data',
        summary: 'Sem pedidos',
        path: '/m/pantry'
    });

    // Reservations (Mock new leads)
    areaStatuses.push({
        id: 'reservations',
        name: 'Reservas',
        status: 'ok',
        summary: '2 novos leads',
        path: '/m/reservations'
    });

    // Financial (Mock)
    areaStatuses.push({
        id: 'financial',
        name: 'Financeiro',
        status: pendingFinancial ? 'critical' : 'ok',
        summary: pendingFinancial ? 'Caixa Aberto' : 'OK',
        path: '/m/financial'
    });


    const isLoading = opsLoading || resLoading || hkLoading || maintLoading;

    return {
        isLoading,
        shift: currentShift,
        kpis: {
            occupancy,
            checkIns,
            checkOuts,
            criticalOps
        },
        alerts,
        recommendedActions: recommendedActions.slice(0, 3),
        areaStatuses,
        refresh
    };
};
