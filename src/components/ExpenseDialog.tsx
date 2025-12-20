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
import { Expense, ExpenseInput, expenseSchema } from "@/hooks/useExpenses";
import { useProperties } from "@/hooks/useProperties";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSubmit: (data: ExpenseInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const ExpenseDialog = ({ open, onOpenChange, expense, onSubmit, isLoading, initialPropertyId }: ExpenseDialogProps) => {
  const { properties } = useProperties();
  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      property_id: initialPropertyId || "",
      description: "",
      amount: 0,
      expense_date: new Date(),
      category: "",
      payment_status: "pending",
      paid_date: undefined,
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        property_id: expense.property_id,
        description: expense.description,
        amount: expense.amount,
        expense_date: new Date(expense.expense_date),
        category: expense.category || "",
        payment_status: expense.payment_status as ExpenseInput['payment_status'],
        paid_date: expense.paid_date ? new Date(expense.paid_date) : undefined,
      });
    } else {
      form.reset({
        property_id: initialPropertyId || (properties.length > 0 ? properties[0].id : ""),
        description: "",
        amount: 0,
        expense_date: new Date(),
        category: "",
        payment_status: "pending",
        paid_date: undefined,
      });
    }
  }, [expense, open, form, properties, initialPropertyId]);

  const handleFormSubmit = (data: ExpenseInput) => {
    onSubmit(data);
  };

  const paymentStatus = form.watch('payment_status');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
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
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder="Ex: Compra de toalhas, Salário do funcionário"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento/Despesa *</Label>
            <Controller
              name="expense_date"
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
            {form.formState.errors.expense_date && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.expense_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria (Opcional)</Label>
            <Input
              id="category"
              placeholder="Ex: Manutenção, Salários, Suprimentos"
              {...form.register("category")}
            />
            {form.formState.errors.category && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="payment_status">Status do Pagamento</Label>
            <Controller
              name="payment_status"
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
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.payment_status && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.payment_status.message}
              </p>
            )}
          </div>

          {paymentStatus === 'paid' && (
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Controller
                name="paid_date"
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
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione a data de pagamento"}
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
              {form.formState.errors.paid_date && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.paid_date.message}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Salvar Alterações" : "Criar Despesa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDialog;