import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    CalendarDays,
    MoreHorizontal,
    Trash2,
    Edit2,
    AlertOctagon,
    AlertTriangle,
    Flag,
    User
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Task } from "@/hooks/useTasks";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PremiumTaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

export const PremiumTaskCard = ({ task, onEdit, onDelete }: PremiumTaskCardProps) => { // Removed onAssign

    const getPriorityStyle = (priority?: string) => {
        switch (priority) {
            case 'critical':
                return {
                    border: "border-l-4 border-l-red-500",
                    icon: AlertOctagon,
                    color: "text-red-500",
                    bg: "bg-red-50 dark:bg-red-900/10"
                };
            case 'high':
                return {
                    border: "border-l-4 border-l-orange-500",
                    icon: AlertTriangle,
                    color: "text-orange-500",
                    bg: "bg-orange-50 dark:bg-orange-900/10"
                };
            case 'medium':
                return {
                    border: "border-l-4 border-l-blue-400",
                    icon: Flag,
                    color: "text-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-900/5"
                };
            default:
                return {
                    border: "border-l-4 border-l-slate-300",
                    icon: Flag,
                    color: "text-slate-400",
                    bg: "bg-slate-50 dark:bg-slate-900/5"
                };
        }
    };

    const priorityStyle = getPriorityStyle(task.priority || 'medium');
    const PriorityIcon = priorityStyle.icon;

    return (
        <Card className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
            priorityStyle.border
        )}>
            <CardContent className="p-4 space-y-3">
                {/* Header: Title and Actions */}
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            {task.priority === 'critical' && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                            <h4 className={cn("font-semibold text-sm leading-snug", task.status === 'done' && "line-through text-muted-foreground")}>
                                {task.title}
                            </h4>
                        </div>
                        {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                            </p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(task)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Footer: Meta Info */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src="" /> {/* TODO: Add avatar_url to profile query if needed */}
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {task.profiles?.full_name ? task.profiles.full_name.substring(0, 2).toUpperCase() : <User className="h-3 w-3" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {task.profiles?.full_name?.split(' ')[0] || "Sem dono"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {task.due_date && (
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                new Date(task.due_date) < new Date() && task.status !== 'done'
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/20"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                            )}>
                                <CalendarDays className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                        )}
                        <div className={cn("p-1 rounded-md bg-background/50", priorityStyle.color)}>
                            <PriorityIcon className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
