import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Home, ListTodo, Briefcase, Sparkles } from "lucide-react";
import { useTasks, Task, TaskInput } from "@/hooks/useTasks";
import { useProperties } from "@/hooks/useProperties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import TaskDialog from "@/components/TaskDialog";
import { PremiumTaskCard } from "@/components/PremiumTaskCard";
import { TaskStatusBadge } from "@/components/TaskStatusBadge";
import { Badge } from "@/components/ui/badge";

const TasksPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!propertiesLoading && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [propertiesLoading, properties, selectedPropertyId]);

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(selectedPropertyId);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    done: filteredTasks.filter(task => task.status === 'done'),
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TaskInput) => {
    if (!selectedPropertyId) return;

    if (selectedTask) {
      await updateTask.mutateAsync({ id: selectedTask.id, task: data });
    } else {
      await createTask.mutateAsync({ ...data, property_id: selectedPropertyId });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      await deleteTask.mutateAsync(taskToDelete);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Central de Tarefas</h1>
            </div>
            <p className="text-muted-foreground ml-12 text-sm">Organize, priorize e delegue atividades operacionais.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex">
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              Sugestão IA
            </Button>
            <Button onClick={handleCreateTask} disabled={!selectedPropertyId} className="shadow-lg shadow-primary/25 rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/30 p-2 rounded-2xl border">
          <Select
            value={selectedPropertyId}
            onValueChange={(value) => setSelectedPropertyId(value)}
            disabled={propertiesLoading || properties.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[280px] h-10 border-0 bg-background shadow-sm rounded-xl">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione uma propriedade" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              className="pl-10 h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {/* Kanban Board */}
        {!selectedPropertyId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-muted/10">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma propriedade selecionada</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Selecione uma propriedade acima para visualizar o quadro de tarefas.
            </p>
          </div>
        ) : isLoading ? (
          <DataTableSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Column: To Do */}
            <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 h-full">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-400" />
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">A Fazer</h3>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">{tasksByStatus.todo.length}</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {tasksByStatus.todo.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium">Lista vazia</p>
                  </div>
                )}
                {tasksByStatus.todo.map((task) => (
                  <PremiumTaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteClick} />
                ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="flex flex-col gap-4 bg-blue-50/50 dark:bg-blue-900/5 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/20 h-full">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300">Em Progresso</h3>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{tasksByStatus['in-progress'].length}</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {tasksByStatus['in-progress'].length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-blue-200/50 rounded-xl">
                    <p className="text-xs text-blue-400/70 font-medium">Nada em andamento</p>
                  </div>
                )}
                {tasksByStatus['in-progress'].map((task) => (
                  <PremiumTaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteClick} />
                ))}
              </div>
            </div>

            {/* Column: Done */}
            <div className="flex flex-col gap-4 bg-emerald-50/50 dark:bg-emerald-900/5 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 h-full">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <h3 className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">Concluído</h3>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{tasksByStatus.done.length}</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {tasksByStatus.done.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-emerald-200/50 rounded-xl">
                    <p className="text-xs text-emerald-400/70 font-medium">Nenhuma conclusão hoje</p>
                  </div>
                )}
                {tasksByStatus.done.map((task) => (
                  <PremiumTaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteClick} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        onSubmit={handleSubmit}
        isLoading={createTask.isPending || updateTask.isPending}
        initialPropertyId={selectedPropertyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TasksPage;