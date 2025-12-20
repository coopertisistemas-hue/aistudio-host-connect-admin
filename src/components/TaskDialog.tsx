import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Task, TaskInput, taskSchema } from "@/hooks/useTasks";
import { useProperties } from "@/hooks/useProperties";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSubmit: (data: TaskInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const TaskDialog = ({ open, onOpenChange, task, onSubmit, isLoading, initialPropertyId }: TaskDialogProps) => {
  const { properties } = useProperties();
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      property_id: initialPropertyId || "",
      title: "",
      description: "",
      status: "todo",
      due_date: undefined,
      assigned_to: null,
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        property_id: task.property_id,
        title: task.title,
        description: task.description || "",
        status: task.status as TaskInput['status'], // Cast to correct enum type
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        assigned_to: task.assigned_to || null,
      });
    } else {
      form.reset({
        property_id: initialPropertyId || (properties.length > 0 ? properties[0].id : ""),
        title: "",
        description: "",
        status: "todo",
        due_date: undefined,
        assigned_to: null,
      });
    }
  }, [task, open, form, properties, initialPropertyId]);

  const handleFormSubmit = (data: TaskInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property_id">Propriedade *</Label>
            <Controller
              name="property_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={properties.length === 0 || !!initialPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.property_id && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.property_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título da Tarefa *</Label>
            <Input
              id="title"
              placeholder="Ex: Verificar check-in, Comprar suprimentos"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes da tarefa."
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Prazo</Label>
            <Controller
              name="due_date"
              control={form.control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.due_date && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.due_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Atribuído a (Opcional)</Label>
            <Controller
              name="assigned_to"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(value) => field.onChange(value === "" ? null : value)}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguém</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.assigned_to && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.assigned_to.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in-progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.status && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;