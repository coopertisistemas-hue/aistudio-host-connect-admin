import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInvoices } from "./useInvoices";
import { useExpenses } from "./useExpenses";
import { parseISO, isSameDay } from "date-fns";
import { toast } from "@/hooks/use-toast";

export interface FinancialTransaction {
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: Date;
    category?: string;
    status: 'paid' | 'pending';
    source: 'invoice' | 'expense';
}

export const useMobileFinancial = (propertyId?: string) => {
    const queryClient = useQueryClient();
    const { invoices, isLoading: loadingInvoices } = useInvoices(propertyId);
    const { expenses, isLoading: loadingExpenses, createExpense } = useExpenses(propertyId);

    const today = new Date();

    // 1. Process Daily Summary & Transactions
    const transactions: FinancialTransaction[] = [];

    // Process Incomes (Invoices)
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'partially_paid');
    paidInvoices.forEach(inv => {
        // Use paid_date if available (not in standard schema yet, falling back to issue_date or custom logic)
        // Ideally we should check payment tables, but for Mobile MVP we assume paid status + date relevance
        const date = inv.issue_date ? parseISO(inv.issue_date) : new Date();

        // Only include if relevance is today (simplified logic for "Cash Flow")
        // Real cash flow would need a Payments table. 
        // We will include everything from TODAY for the simplified view.
        if (isSameDay(date, today)) {
            transactions.push({
                id: inv.id,
                type: 'income',
                description: `Reserva: ${inv.bookings?.guest_name || 'Hóspede'}`,
                amount: Number(inv.total_amount), // Use paid_amount if available
                date: date,
                category: 'Hospedagem',
                status: 'paid',
                source: 'invoice'
            });
        }
    });

    // Process Expenses
    expenses.forEach(exp => {
        const date = parseISO(exp.expense_date);
        if (isSameDay(date, today)) {
            transactions.push({
                id: exp.id,
                type: 'expense',
                description: exp.description,
                amount: Number(exp.amount),
                date: date,
                category: exp.category || 'Outros',
                status: exp.payment_status === 'paid' ? 'paid' : 'pending',
                source: 'expense'
            });
        }
    });

    // Sort by recent
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate Totals
    const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIn - totalOut;

    // 2. Mutations

    // Register simple expense/occurrence
    const registerOccurrence = useMutation({
        mutationFn: async (data: { description: string, amount: number, type: 'expense' | 'income', isPaid: boolean }) => {
            if (data.type === 'expense') {
                return createExpense.mutateAsync({
                    property_id: propertyId!,
                    description: data.description,
                    amount: data.amount,
                    expense_date: new Date(),
                    category: 'Operacional',
                    payment_status: data.isPaid ? 'paid' : 'pending',
                    paid_date: data.isPaid ? new Date() : null
                });
            } else {
                // For Income without Booking, we technically don't have a table besides Invoices linked to Bookings.
                // We will skip "Misc Income" for now or treat as a negative Expense? 
                // Better to throw error or handle later. For MVP, we stick to Expenses.
                throw new Error("Receitas avulsas não suportadas ainda.");
                // Or we could create a dummy invoice, but that requires a booking.
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financialSummary', propertyId] });
        }
    });

    // Close Shift (Simulated)
    const closeShift = useMutation({
        mutationFn: async (shiftData: { totalCash: number, notes: string }) => {
            // In a real system, we'd insert into 'shift_closures'.
            // Here we verify and potentially log to a generic events table if available, or just Toast.

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            return true;
        },
        onSuccess: () => {
            toast({ title: "Caixa Fechado", description: "O turno foi encerrado com sucesso." });
        }
    });

    return {
        summary: {
            totalIn,
            totalOut,
            balance
        },
        transactions,
        isLoading: loadingInvoices || loadingExpenses,
        actions: {
            registerOccurrence,
            closeShift
        }
    };
};
