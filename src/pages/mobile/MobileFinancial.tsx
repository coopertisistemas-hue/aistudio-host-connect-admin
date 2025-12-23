import React, { useState } from "react";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    Lock,
    Search,
    CreditCard,
    DollarSign,
    Smartphone,
    MoreHorizontal
} from "lucide-react";
import {
    MobileShell,
    MobileTopHeader
} from "@/components/mobile/MobileShell";
import {
    PremiumSkeleton,
    CardContainer
} from "@/components/mobile/MobileUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobileFinancial, FinancialTransaction } from "@/hooks/useMobileFinancial";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreateFinancialSheet } from "@/components/mobile/CreateFinancialSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// --- Components ---

const StatMiniBlock = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold opacity-60 uppercase mb-0.5">{label}</span>
        <span className={cn("text-sm font-bold", color)}>{value}</span>
    </div>
);

const TransactionCard = ({ transaction, onClick }: { transaction: FinancialTransaction, onClick: () => void }) => {
    const isIncome = transaction.type === 'income';

    let Icon = DollarSign;
    if (transaction.paymentMethod === 'credit_card' || transaction.paymentMethod === 'debit_card') Icon = CreditCard;
    if (transaction.paymentMethod === 'pix') Icon = Smartphone;
    if (transaction.paymentMethod === 'cash') Icon = Wallet;

    return (
        <div
            onClick={onClick}
            className="group rounded-2xl p-4 shadow-sm border border-white/60 bg-white hover:bg-neutral-50 active:scale-[0.99] transition-all cursor-pointer flex justify-between items-center"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-opacity-50",
                    isIncome ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-neutral-800 line-clamp-1">{transaction.description}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                            {transaction.category}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                            {format(transaction.date, "HH:mm")}
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <span className={cn(
                    "block text-sm font-black tracking-tight",
                    isIncome ? "text-emerald-600" : "text-rose-600"
                )}>
                    {isIncome ? '+' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                </span>
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                    {transaction.paymentMethod === 'credit_card' ? 'Crédito' :
                        transaction.paymentMethod === 'debit_card' ? 'Débito' :
                            transaction.paymentMethod === 'cash' ? 'Dinheiro' :
                                transaction.paymentMethod === 'pix' ? 'Pix' : 'Outro'}
                </span>
            </div>
        </div>
    );
};

// --- Main Component ---

const MobileFinancial: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { summary, transactions, isLoading, actions } = useMobileFinancial(selectedPropertyId);

    const [activeFilter, setActiveFilter] = useState<string>("all"); // all | cash | card | pix
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleCloseShift = async () => {
        await actions.closeShift.mutateAsync({
            totalCash: summary.balance, // Should be cashBalance conceptually, but keeping global for now
            notes: "Fechamento via mobile"
        });
    };

    // Filter Logic
    const getDisplayList = () => {
        let list = transactions;

        if (activeFilter === 'cash') list = list.filter(t => t.paymentMethod === 'cash');
        if (activeFilter === 'card') list = list.filter(t => ['credit_card', 'debit_card'].includes(t.paymentMethod));
        if (activeFilter === 'pix') list = list.filter(t => t.paymentMethod === 'pix');

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.description.toLowerCase().includes(q) ||
                (t.category && t.category.toLowerCase().includes(q))
            );
        }
        return list;
    };

    const displayList = getDisplayList();

    return (
        <MobileShell
            header={
                <MobileTopHeader
                    title="Financeiro"
                    subtitle="Movimentações do dia"
                    showBack={true}
                />
            }
        >
            <div className="flex flex-col h-full relative z-10 w-full max-w-[420px] mx-auto pb-[calc(env(safe-area-inset-bottom,0px)+80px)]">

                {/* Hero / Daily Balance */}
                <div className="px-4 pt-4 pb-2">
                    <CardContainer className="p-5 bg-gradient-to-br from-emerald-900 to-emerald-800 text-white border-none shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Saldo do Dia</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-3xl font-black">{formatCurrency(summary.balance)}</span>
                                </div>
                            </div>
                            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                <Wallet className="h-5 w-5 text-emerald-300" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 relative z-10">
                            <StatMiniBlock label="Entradas" value={formatCurrency(summary.totalIn)} color="text-emerald-300" />
                            <StatMiniBlock label="Saídas" value={formatCurrency(summary.totalOut)} color="text-rose-300" />
                        </div>
                    </CardContainer>
                </div>

                {/* Cashbox (Recepção) Card */}
                <div className="px-4 pb-4">
                    <div className="p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500" />
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wide flex items-center gap-2">
                                <Wallet className="h-3.5 w-3.5 text-neutral-400" /> Caixa Recepção (Espécie)
                            </h3>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 h-5">
                                Em Mãos
                            </Badge>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-2xl font-bold text-neutral-800 block">{formatCurrency(summary.cashBalance)}</span>
                                <div className="flex gap-3 mt-1">
                                    <span className="text-[10px] text-emerald-600 font-medium">+ {formatCurrency(summary.cashIn)}</span>
                                    <span className="text-[10px] text-rose-600 font-medium">- {formatCurrency(summary.cashOut)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="sticky top-[58px] z-30 px-4 py-2 bg-gradient-to-b from-slate-50/90 to-slate-50/80 backdrop-blur-xl border-b border-white/50 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Buscar lançamentos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-10 rounded-xl bg-white border-neutral-200 focus:border-emerald-300 focus:ring-emerald-500/10 text-sm font-medium shadow-sm"
                        />
                    </div>
                    {/* Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'cash', label: 'Dinheiro' },
                            { id: 'card', label: 'Cartão' },
                            { id: 'pix', label: 'Pix' }
                        ].map(chip => (
                            <button
                                key={chip.id}
                                onClick={() => setActiveFilter(chip.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                    activeFilter === chip.id
                                        ? "bg-neutral-800 text-white border-neutral-800 shadow-md"
                                        : "bg-white text-neutral-500 border-neutral-200"
                                )}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transactions List */}
                <div className="px-4 py-4 space-y-3 min-h-[300px]">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <PremiumSkeleton key={i} className="h-20 w-full rounded-2xl bg-white/50" />
                        ))
                    ) : displayList.length > 0 ? (
                        displayList.map(t => (
                            <TransactionCard
                                key={t.id}
                                transaction={t}
                                onClick={() => setSelectedTransaction(t)}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-300">
                                <Wallet className="h-8 w-8" />
                            </div>
                            <h3 className="text-sm font-bold text-neutral-600 mb-1">Sem movimentações</h3>
                            <p className="text-xs text-neutral-400">Nenhum lançamento encontrado para este filtro.</p>
                        </div>
                    )}
                </div>

                {/* Floating Action Button area (Simulated via fixed bottom bar or just inline content actions above) */}
                <div className="fixed bottom-[calc(env(safe-area-inset-bottom,20px)+20px)] left-0 right-0 px-4 pointer-events-none flex justify-end gap-3 max-w-[420px] mx-auto z-40">
                    <CreateFinancialSheet>
                        <Button className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg pointer-events-auto px-6 font-bold flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Nova
                        </Button>
                    </CreateFinancialSheet>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="secondary" className="h-14 w-14 rounded-2xl bg-white border border-neutral-200 shadow-lg pointer-events-auto flex items-center justify-center">
                                <Lock className="h-5 w-5 text-neutral-600" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Fechar Caixa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Confirma o fechamento do caixa com saldo de {formatCurrency(summary.balance)}?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl h-11">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="rounded-xl h-11 bg-emerald-600 font-bold"
                                    onClick={handleCloseShift}
                                >
                                    Confirmar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

            </div>

            {/* Detail Sheet */}
            <Sheet open={!!selectedTransaction} onOpenChange={(o) => !o && setSelectedTransaction(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px] min-h-[50vh] p-6 pb-10 max-w-md mx-auto">
                    {selectedTransaction && (
                        <div>
                            <SheetHeader className="mb-6 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] px-2 py-0.5 border h-6",
                                        selectedTransaction.type === 'income' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                    )}>
                                        {selectedTransaction.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                                    </Badge>
                                    <span className="text-xs font-bold text-neutral-400">
                                        {format(selectedTransaction.date, "dd MMM, HH:mm")}
                                    </span>
                                </div>
                                <SheetTitle className="text-3xl font-black text-neutral-800 leading-tight">
                                    {formatCurrency(selectedTransaction.amount)}
                                </SheetTitle>
                                <SheetDescription className="text-neutral-500 font-medium text-base">
                                    {selectedTransaction.description}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-500">Categoria</span>
                                        <span className="font-bold text-neutral-800">{selectedTransaction.category}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-500">Método</span>
                                        <span className="font-bold text-neutral-800 uppercase text-xs bg-white px-2 py-1 rounded border border-neutral-200">
                                            {selectedTransaction.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                                                selectedTransaction.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                                                    selectedTransaction.paymentMethod === 'cash' ? 'Dinheiro (Espécie)' :
                                                        selectedTransaction.paymentMethod === 'pix' ? 'Pix' : 'Outros'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-500">Status</span>
                                        <span className={cn("font-bold", selectedTransaction.status === 'paid' ? "text-emerald-600" : "text-amber-600")}>
                                            {selectedTransaction.status === 'paid' ? 'Pago / Recebido' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl font-bold border-neutral-200"
                                    onClick={() => setSelectedTransaction(null)}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

export default MobileFinancial;
