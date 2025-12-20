import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";
import { Edit, Trash2, Calendar, User } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const getStatusBadge = (status: Task['status']) => {
  switch (status) {
    case 'todo':
      return <Badge variant="secondary">A Fazer</Badge>;
    case 'in-progress':
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80">Em Progresso</Badge>;
    case 'done':
      return <Badge variant="default" className="bg-success hover:bg-success/80">Concluída</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => {
  const isOverdue = task.due_date ? isPast(new Date(task.due_date)) && task.status !== 'done' : false;

  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(task.status)}
            {isOverdue && <Badge variant="destructive">Atrasada</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <CardDescription className="line-clamp-2">
            {task.description}
          </CardDescription>
        )}

        <div className="space-y-2 text-sm">
          {task.due_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Prazo: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          {task.assigned_to && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span>Responsável: { (task as any).profiles?.full_name || task.assigned_to }</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(task)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;