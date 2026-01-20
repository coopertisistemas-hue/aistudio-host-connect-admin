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
import { Plus, Search, DollarSign, Home, Edit, Trash2, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { useExpenses, Expense, ExpenseInput } from "@/hooks/useExpenses";
import { useProperties } from "@/hooks/useProperties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import ExpenseDialog from "@/components/ExpenseDialog";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useAuth } from "@/hooks/useAuth";

const ExpensesPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses(selectedPropertyId);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateExpense = () => {
    if (isViewer) return;
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    if (isViewer) return;
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: ExpenseInput) => {
    if (isViewer) return;
    if (!selectedPropertyId) {
      console.error("No property selected for expense operation.");
      return;
    }

    // Ensure paid_date is null if status is not paid
    const finalData: ExpenseInput = {
      ...data,
      paid_date: data.payment_status === 'paid' ? data.paid_date : null,
    };

    if (selectedExpense) {
      await updateExpense.mutateAsync({ id: selectedExpense.id, expense: finalData });
    } else {
      await createExpense.mutateAsync({ ...finalData, property_id: selectedPropertyId });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    if (isViewer) return;
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isViewer) return;
    if (expenseToDelete) {
      await deleteExpense.mutateAsync(expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const getPaymentStatusBadge = (status: Expense['payment_status'], expenseDate: string) => {
    const isOverdue = status === 'pending' && isPast(new Date(expenseDate));

    if (isOverdue) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Atrasada</Badge>;
    }

    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-success hover:bg-success/80 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Paga</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Atrasada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isDataLoading = isLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Despesas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as despesas das suas propriedades
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateExpense} disabled={!selectedPropertyId || isViewer}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>

        {/* Property Selector and Search */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            disabled={propertiesLoading || properties.length === 0 || propertyStateLoading}
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
              placeholder="Buscar despesa por descrição ou categoria..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {/* Expenses List */}
        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para gerenciar suas despesas.
              </p>
            </CardContent>
          </Card>
        ) : isDataLoading ? (
          <DataTableSkeleton variant="table" columns={6} />
        ) : filteredExpenses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhuma despesa encontrada" : "Nenhuma despesa cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando sua primeira despesa para esta propriedade."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateExpense} disabled={isViewer}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Despesa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Vencimento</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">{expense.description}</td>
                        <td className="px-4 py-3 text-sm">{expense.category || 'N/A'}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-destructive">
                          - R$ {expense.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getPaymentStatusBadge(expense.payment_status as Expense['payment_status'], expense.expense_date)}
                          {expense.paid_date && expense.payment_status === 'paid' && (
                            <p className="text-xs text-muted-foreground mt-1">Pago em: {format(new Date(expense.paid_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditExpense(expense)} disabled={isViewer}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(expense.id)} disabled={isViewer}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expense Dialog */}
      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={selectedExpense}
        onSubmit={handleSubmit}
        isLoading={createExpense.isPending || updateExpense.isPending}
        initialPropertyId={selectedPropertyId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
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

export default ExpensesPage;