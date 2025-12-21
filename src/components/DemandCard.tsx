import { Card, CardContent } from "@/components/ui/card";
import { MaintenanceDemand } from "@/hooks/useDemands";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle, ArrowRight, Construction } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface DemandCardProps {
    demand: MaintenanceDemand;
}

export const DemandCard = ({ demand }: DemandCardProps) => {
    const navigate = useNavigate();

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'critical': return { label: 'Crítica', color: 'bg-rose-500 text-white' };
            case 'high': return { label: 'Alta', color: 'bg-orange-500 text-white' };
            case 'medium': return { label: 'Média', color: 'bg-amber-500 text-white' };
            case 'low': return { label: 'Baixa', color: 'bg-blue-500 text-white' };
            default: return { label: priority, color: 'bg-slate-500 text-white' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'todo': return 'Aberta';
            case 'in-progress': return 'Em Execução';
            case 'waiting': return 'Aguardando Peça';
            case 'done': return 'Concluída';
            default: return status;
        }
    };

    const priority = getPriorityConfig(demand.priority);

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-none shadow-sm overflow-hidden"
            onClick={() => navigate(`/operation/demands/${demand.id}`)}
        >
            <div className="flex items-stretch">
                {/* Status Indicator Bar */}
                <div className={`w-1.5 ${demand.status === 'done' ? 'bg-success' :
                        demand.status === 'in-progress' ? 'bg-blue-500' :
                            demand.priority === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />

                <CardContent className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Construction className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold truncate max-w-[150px]">{demand.title}</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {demand.rooms?.room_number ? `Quarto ${demand.rooms.room_number}` : demand.category || 'Geral'}
                                </p>
                            </div>
                        </div>
                        <Badge className={`text-[9px] uppercase font-bold py-0 h-4 border-none ${priority.color}`}>
                            {priority.label}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(demand.created_at), "dd MMM", { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{demand.profiles?.full_name?.split(' ')[0] || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground">{getStatusLabel(demand.status)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};
