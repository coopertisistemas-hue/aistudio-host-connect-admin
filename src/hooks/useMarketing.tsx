import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingConnector {
    id: string;
    property_id: string;
    provider: 'google' | 'booking' | 'expedia' | 'tripadvisor' | 'meta';
    status: 'disconnected' | 'connected' | 'error';
    config: any;
    updated_at: string;
}

export interface SyncRun {
    id: string;
    connector_id: string;
    status: 'success' | 'fail';
    started_at: string;
    ended_at: string;
    summary: any;
    error_text?: string;
}

export interface DailyMetric {
    id: string;
    metric_date: string;
    impressions: number;
    clicks: number;
    calls: number;
    direction_requests: number;
    website_visits: number;
    revenue_est: number;
}

export const useMarketing = (propertyId?: string) => {
    const queryClient = useQueryClient();

    // Fetch all connectors for the property
    const { data: connectors = [], isLoading: isLoadingConnectors } = useQuery({
        queryKey: ['marketing-connectors', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];
            const { data, error } = await supabase
                .from('marketing_connectors')
                .select('*')
                .eq('property_id', propertyId);

            if (error) throw error;
            return data as MarketingConnector[];
        },
        enabled: !!propertyId
    });

    // Fetch day metrics
    const { data: metrics = [], isLoading: isLoadingMetrics } = useQuery({
        queryKey: ['marketing-metrics', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];
            const { data, error } = await supabase
                .from('marketing_metrics_daily')
                .select('*')
                .eq('property_id', propertyId)
                .order('metric_date', { ascending: false })
                .limit(30);

            if (error) throw error;
            return data as DailyMetric[];
        },
        enabled: !!propertyId
    });

    // Fetch sync logs
    const { data: syncLogs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['marketing-sync-logs', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];
            // This is a simplified fetch, might need a join with connectors
            const { data, error } = await supabase
                .from('marketing_sync_runs')
                .select(`
          *,
          marketing_connectors!inner(property_id)
        `)
                .eq('marketing_connectors.property_id', propertyId)
                .order('started_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data as any[];
        },
        enabled: !!propertyId
    });

    // Mutation to connect/update a provider
    const connectProvider = useMutation({
        mutationFn: async ({ provider, config }: { provider: string, config: any }) => {
            if (!propertyId) throw new Error("Property ID required");

            const { data, error } = await supabase
                .from('marketing_connectors')
                .upsert({
                    property_id: propertyId,
                    provider,
                    config,
                    status: 'connected',
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-connectors'] });
            toast.success("Conectado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(`Erro ao conectar: ${error.message}`);
        }
    });

    // Mutation to trigger manual sync (placeholder)
    const syncNow = useMutation({
        mutationFn: async (connectorId: string) => {
            const startedAt = new Date().toISOString();

            // Simulate sync delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const { error } = await supabase
                .from('marketing_sync_runs')
                .insert({
                    connector_id: connectorId,
                    status: 'success',
                    summary: { message: "Sincronização manual concluída com dados simulados." },
                    started_at: startedAt,
                    ended_at: new Date().toISOString()
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-sync-logs'] });
            toast.success("Sincronização concluída!");
        }
    });

    return {
        connectors,
        metrics,
        syncLogs,
        isLoading: isLoadingConnectors || isLoadingMetrics || isLoadingLogs,
        connectProvider,
        syncNow
    };
};
