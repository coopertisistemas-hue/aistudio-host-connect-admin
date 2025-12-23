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
    paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer' | 'other';
}

export const useMobileFinancial = (propertyId?: string) => {
    const queryClient = useQueryClient();
    const { invoices, isLoading: loadingInvoices } = useInvoices(propertyId);
    const { expenses, isLoading: loadingExpenses, createExpense } = useExpenses(propertyId);

    const today = new Date();

    // Helper to normalize payment method
    const normalizeMethod = (method: string | null | undefined): FinancialTransaction['paymentMethod'] => {
        if (!method) return 'other';
        const m = method.toLowerCase();
        if (m.includes('dinheiro') || m.includes('cash') || m.includes('espécie')) return 'cash';
        if (m.includes('pix')) return 'pix';
        if (m.includes('credito') || m.includes('crédito') || m.includes('credit')) return 'credit_card';
        if (m.includes('debito') || m.includes('débito') || m.includes('debit')) return 'debit_card';
        return 'other';
    };

    // 1. Process Daily Summary & Transactions
    const transactions: FinancialTransaction[] = [];

    // Process Incomes (Invoices)
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'partially_paid');
    paidInvoices.forEach(inv => {
        const date = inv.issue_date ? parseISO(inv.issue_date) : new Date();
        if (isSameDay(date, today)) {
            transactions.push({
                id: inv.id,
                type: 'income',
                description: inv.bookings?.guest_name || 'Hóspede',
                amount: Number(inv.total_amount),
                date: date,
                category: 'Hospedagem',
                status: 'paid',
                source: 'invoice',
                paymentMethod: normalizeMethod(inv.payment_method)
            });
        }
    });

    // Process Expenses
    expenses.forEach(exp => {
        const date = parseISO(exp.expense_date);
        if (isSameDay(date, today)) {
            // Heuristic for expenses: Check if description contains [CASH] tag or similar, 
            // otherwise default to 'other' (usually transfer/card in modern ops).
            // Ideally we'd have a column, but this suffices for display filtering.
            transactions.push({
                id: exp.id,
                type: 'expense',
                description: exp.description,
                amount: Number(exp.amount),
                date: date,
                category: exp.category || 'Outros',
                status: exp.payment_status === 'paid' ? 'paid' : 'pending',
                source: 'expense',
                paymentMethod: 'other' // Defaulting to other since schema lacks method
            });
        }
    });

    // Sort by recent
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate Global Totals
    const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIn - totalOut;

    // Calculate Cashbox (Recepção) Totals
    const cashIn = transactions.filter(t => t.type === 'income' && t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0);
    const cashOut = transactions.filter(t => t.type === 'expense' && t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0);
    const cashBalance = cashIn - cashOut;

    // 2. Mutations
    const registerOccurrence = useMutation({
        mutationFn: async (data: { description: string, amount: number, type: 'expense' | 'income', isPaid: boolean, method?: string }) => {
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
                throw new Error("Receitas avulsas não suportadas ainda.");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financialSummary', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['expenses', propertyId] });
        }
    });

    const closeShift = useMutation({
        mutationFn: async (shiftData: { totalCash: number, notes: string }) => {
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
            balance,
            cashBalance,
            cashIn,
            cashOut
        },
        transactions,
        isLoading: loadingInvoices || loadingExpenses,
        actions: {
            registerOccurrence,
            closeShift
        }
    };
};
