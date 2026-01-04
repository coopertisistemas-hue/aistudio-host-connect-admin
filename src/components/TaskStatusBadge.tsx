import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TaskStatusBadgeProps {
  status: "todo" | "in-progress" | "done";
  className?: string;
}

export const TaskStatusBadge = ({ status, className }: TaskStatusBadgeProps) => {
  const styles = {
    todo: {
      label: "A Fazer",
      icon: Circle,
      className: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800",
    },
    "in-progress": {
      label: "Em Progresso",
      icon: Clock,
      className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900",
    },
    done: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900",
    },
  };

  const style = styles[status] || styles.todo;
  const Icon = style.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 py-1 px-2.5 shadow-sm transition-all", style.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {style.label}
    </Badge>
  );
};
