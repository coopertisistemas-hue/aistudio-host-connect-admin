import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, ListTodo, Home } from "lucide-react";
import { useTasks, Task, TaskInput } from "@/hooks/useTasks";
import { useProperties } from "@/hooks/useProperties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import TaskDialog from "@/components/TaskDialog";
import TaskCard from "@/components/TaskCard";

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
    if (!selectedPropertyId) {
      console.error("No property selected for task operation.");
      return;
    }

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tarefas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as tarefas e atividades das suas propriedades
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateTask} disabled={!selectedPropertyId}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Property Selector and Search */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <Select
            value={selectedPropertyId}
            onValueChange={(value) => setSelectedPropertyId(value)}
            disabled={propertiesLoading || properties.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Selecione uma propriedade" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name} ({prop.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefa por título ou descrição..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {/* Tasks Kanban Board */}
        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para gerenciar suas tarefas.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <DataTableSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* To Do Column */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ListTodo className="h-5 w-5" /> A Fazer ({tasksByStatus.todo.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[200px]">
                {tasksByStatus.todo.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhuma tarefa a fazer.</p>
                ) : (
                  tasksByStatus.todo.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteClick} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-blue-500" /> Em Progresso ({tasksByStatus['in-progress'].length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[200px]">
                {tasksByStatus['in-progress'].length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhuma tarefa em progresso.</p>
                ) : (
                  tasksByStatus['in-progress'].map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteClick} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-success" /> Concluídas ({tasksByStatus.done.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[200px]">
                {tasksByStatus.done.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhuma tarefa concluída.</p>
                ) : (
                  tasksByStatus.done.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteClick} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        onSubmit={handleSubmit}
        isLoading={createTask.isPending || updateTask.isPending}
        initialPropertyId={selectedPropertyId}
      />

      {/* Delete Confirmation Dialog */}
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