import { useOperationsNow } from "./useOperationsNow";
import { useMobileReservations } from "./useMobileReservations";

export interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    bottlenecks: string[];
}

export const useMobileExecutive = (propertyId?: string) => {
    // 1. Fetch data from existing operational hooks
    const { summary: opsSummary, isLoading: opsLoading } = useOperationsNow(propertyId);
    const { stats: resStats, pipeline, isLoading: resLoading } = useMobileReservations(propertyId);

    // 2. Aggregate Data
    const arrivalsTotal = resStats?.arrivalsToday || 0;
    // We don't have "Checked-in" count directly exposed in generic hooks, 
    // but we can infer or simpler MVP: just show total expected.
    // For "Bottlenecks", we'd ideally want "Arrivals NOT YET checked in" vs "Clean Rooms".
    // MVP: Pending Arrivals vs Available Clean Rooms (complex to fetch efficiently without specific query).
    // Let's stick to what we have:

    // Operations
    const pendingCritical = opsSummary?.criticalTasks?.length || 0;
    const openOccurrences = opsSummary?.recentOccurrences?.filter((o: any) => o.status === 'pending').length || 0;

    // Reservations/Sales
    const newLeads = pipeline?.new?.length || 0;
    const negotiationLeads = pipeline?.negotiation?.length || 0;

    // 3. Health Logic
    const bottlenecks: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let score = 100;

    // Rule 1: Critical Tasks (Maintenance/Housekeeping high priority)
    if (pendingCritical > 0) {
        status = 'critical';
        score -= (pendingCritical * 10);
        bottlenecks.push(`${pendingCritical} tarefas críticas pendentes`);
    }

    // Rule 2: Open Occurrences
    if (openOccurrences > 2) {
        if (status !== 'critical') status = 'warning';
        score -= (openOccurrences * 5);
        bottlenecks.push(`${openOccurrences} ocorrências em aberto`);
    }

    // Rule 3: Sales Pipeline Stagnation (Mock logic for now)
    if (newLeads > 5) {
        // High number of untreated leads
        if (status !== 'critical') status = 'warning';
        score -= 5;
        bottlenecks.push(`${newLeads} novos leads sem tratamento`);
    }

    // Clamp score
    score = Math.max(0, score);

    return {
        health: {
            status,
            score,
            bottlenecks
        },
        kpis: {
            movements: {
                arrivals: arrivalsTotal,
                departures: resStats?.departuresToday || 0,
                occupancy: resStats?.occupancyRate || 0
            },
            operations: {
                critical: pendingCritical,
                occurrences: openOccurrences,
                maintenance: 0 // Placeholder if we want specific counts later
            },
            sales: {
                newLeads,
                negotiation: negotiationLeads
            }
        },
        isLoading: opsLoading || resLoading
    };
};
