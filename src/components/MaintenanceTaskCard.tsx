import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Wrench,
    ArrowRight,
    Calendar,
    User,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Construction
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MaintenanceDemand } from "@/hooks/useDemands";

interface MaintenanceTaskCardProps {
    demand: MaintenanceDemand;
    onClick: () => void;
}

export const MaintenanceTaskCard = ({ demand, onClick }: MaintenanceTaskCardProps) => {
    const priorityConfig = {
        critical: {
            color: "border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-600/5",
            icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
            badge: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200"
        },
        high: {
            color: "border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5",
            icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
            badge: "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-200"
        },
        medium: {
            color: "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5",
            icon: <Clock className="h-4 w-4 text-amber-600" />,
            badge: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200"
        },
        low: {
            color: "border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-blue-600/5",
            icon: <Wrench className="h-4 w-4 text-blue-600" />,
            badge: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200"
        }
    };

    const statusConfig = {
        todo: { label: "Aberta", icon: Construction, color: "text-slate-600" },
        "in-progress": { label: "Em Execução", icon: Wrench, color: "text-blue-600" },
        waiting: { label: "Aguardando", icon: Clock, color: "text-amber-600" },
        done: { label: "Concluída", icon: CheckCircle2, color: "text-emerald-600" }
    };

    const config = priorityConfig[demand.priority as keyof typeof priorityConfig] || priorityConfig.medium;
    const status = statusConfig[demand.status as keyof typeof statusConfig] || statusConfig.todo;
    const StatusIcon = status.icon;

    return (
        <Card
            className={`group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${config.color} overflow-hidden relative`}
            onClick={onClick}
        >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <CardHeader className="p-5 pb-3 relative z-10">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                            <Wrench className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight truncate">
                                {demand.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-medium truncate flex items-center gap-1.5 mt-0.5">
                                {demand.rooms?.room_number
                                    ? <span className="font-semibold text-primary">Quarto {demand.rooms.room_number}</span>
                                    : <span className="italic">Área Comum</span>
                                }
                                <span>•</span>
                                <span>{demand.category || 'Geral'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className={`font-semibold border ${config.badge}`}>
                        {config.icon}
                        <span className="ml-1.5 capitalize">{demand.priority === 'critical' ? 'Crítica' : demand.priority}</span>
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-md border border-border/50">
                        <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
                        <span>{status.label}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(demand.created_at), "dd MMM", { locale: ptBR })}</span>
                        </div>
                        {demand.profiles?.full_name && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{demand.profiles.full_name.split(' ')[0]}</span>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg -mr-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
