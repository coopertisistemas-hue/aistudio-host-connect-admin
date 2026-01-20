import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, ArrowRight, Clock, AlertCircle, Droplet, CheckCircle2 } from "lucide-react";

interface HousekeepingTaskCardProps {
    task: {
        room: {
            id: string;
            room_number: string;
            room_types: {
                name: string;
            } | null;
            status: string;
        };
        reason: string;
        priority: 'high' | 'medium' | 'low';
        checkout_time?: string;
        status: 'urgent' | 'pending' | 'in_progress' | 'completed'; // Mapped from logic
    };
    onStartCleaning: () => void;
    onCompleteCleaning: () => void;
    onViewDetails: () => void;
    isViewer?: boolean;
}

export const HousekeepingTaskCard = ({ task, onStartCleaning, onCompleteCleaning, onViewDetails, isViewer }: HousekeepingTaskCardProps) => {
    const priorityStyles = {
        high: "border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-600/5",
        medium: "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5",
        low: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
    };

    const statusIcons = {
        urgent: <AlertCircle className="h-5 w-5 text-rose-600" />,
        pending: <Clock className="h-5 w-5 text-amber-600" />,
        in_progress: <Droplet className="h-5 w-5 text-blue-600 animate-pulse" />,
        completed: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    };

    // Determine task status for UI if not explicitly passed (or map from existing data)
    // For now using the props passed, but fallback logic can remain in parent
    const contextStatus = task.status;

    return (
        <Card className={`group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${priorityStyles[task.priority]} overflow-hidden relative`}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <CardHeader className="p-5 pb-3 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Bed className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl font-bold tracking-tight">
                                Quarto {task.room.room_number}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-medium truncate">
                                {task.room.room_types?.name || 'Standard'} • {task.reason}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {statusIcons[contextStatus]}
                        {task.checkout_time && (
                            <Badge variant="outline" className="font-semibold text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                {task.checkout_time}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 relative z-10">
                <div className="flex items-center gap-2">
                    {task.room.status === 'dirty' && (
                        <Button
                            onClick={(e) => { e.stopPropagation(); onCompleteCleaning(); }}
                            disabled={isViewer}
                            className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {isViewer ? "Acesso Restrito" : "Marcar Limpo"}
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
