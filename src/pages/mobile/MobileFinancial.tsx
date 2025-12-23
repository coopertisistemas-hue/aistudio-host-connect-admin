import React, { useState } from "react";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    Lock
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { Button } from "@/components/ui/button";
import { useMobileFinancial } from "@/hooks/useMobileFinancial";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreateFinancialSheet } from "@/components/mobile/CreateFinancialSheet";
import { format } from "date-fns";
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

const MobileFinancial: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { summary, transactions, isLoading, actions } = useMobileFinancial(selectedPropertyId);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleCloseShift = async () => {
        await actions.closeShift.mutateAsync({
            totalCash: summary.balance,
            notes: "Fechamento via mobile"
        });
    };

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Financeiro"
                    subtitle="Fluxo de Caixa Hoje"
                    rightAction={<CreateFinancialSheet />}
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-24 space-y-6">

                {/* Balance Card */}
                <CardContainer className="p-5 bg-gradient-to-br from-emerald-900 to-emerald-800 text-white border-none shadow-md">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-xs font-bold opacity-70 uppercase tracking-widest">Saldo do Dia</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-3xl font-bold">{formatCurrency(summary.balance)}</span>
                            </div>
                        </div>
                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Wallet className="h-5 w-5 text-emerald-300" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <ArrowUpCircle className="h-5 w-5 text-emerald-300" />
                            </div>
                            <div>
                                <span className="text-[10px] opacity-60 uppercase block mb-0.5">Entradas</span>
                                <span className="text-sm font-bold">{formatCurrency(summary.totalIn)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                                <ArrowDownCircle className="h-5 w-5 text-rose-300" />
                            </div>
                            <div>
                                <span className="text-[10px] opacity-60 uppercase block mb-0.5">Saídas</span>
                                <span className="text-sm font-bold">{formatCurrency(summary.totalOut)}</span>
                            </div>
                        </div>
                    </div>
                </CardContainer>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <CreateFinancialSheet>
                        <Button variant="outline" className="h-12 bg-white border-neutral-200 text-neutral-600 rounded-xl font-bold shadow-sm">
                            Nova Movimentação
                        </Button>
                    </CreateFinancialSheet>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="h-12 bg-white border-neutral-200 text-neutral-600 rounded-xl font-bold shadow-sm gap-2">
                                <Lock className="h-4 w-4" /> Fechar Caixa
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Fechar Caixa do Dia?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Isso registrará o saldo atual de {formatCurrency(summary.balance)} como o fechamento do turno.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl h-11">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="rounded-xl h-11 bg-emerald-600 font-bold"
                                    onClick={handleCloseShift}
                                >
                                    Confirmar Fechamento
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Transactions List */}
                <div>
                    <SectionTitleRow
                        title="Movimentações"
                        rightElement={<span className="text-xs font-bold text-neutral-400">{format(new Date(), "dd 'de' MMMM")}</span>}
                    />

                    {isLoading ? (
                        <div className="text-center py-10 text-neutral-400 text-sm">Carregando...</div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((t) => (
                                <CardContainer
                                    key={`${t.source}-${t.id}`}
                                    className="p-4 border-none shadow-sm flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {t.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#1A1C1E]">{t.description}</h4>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 rounded">{t.category}</span>
                                                {t.status === 'pending' && (
                                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 rounded font-bold">Pendente</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "block font-bold",
                                            t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                        <span className="text-[10px] text-neutral-400">
                                            {format(t.date, "HH:mm")}
                                        </span>
                                    </div>
                                </CardContainer>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[20vh] text-center border-2 border-dashed border-neutral-100 rounded-2xl">
                            <div className="h-10 w-10 bg-neutral-50 rounded-full flex items-center justify-center mb-2">
                                <Wallet className="h-5 w-5 text-neutral-300" />
                            </div>
                            <span className="text-sm text-neutral-400">Nenhuma movimentação hoje.</span>
                        </div>
                    )}
                </div>

            </div>
        </MobileShell>
    );
};

export default MobileFinancial;
