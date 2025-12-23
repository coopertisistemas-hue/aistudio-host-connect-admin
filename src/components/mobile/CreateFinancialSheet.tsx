import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMobileFinancial } from "@/hooks/useMobileFinancial";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CreateFinancialSheet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const { selectedPropertyId } = useSelectedProperty();
    const { actions } = useMobileFinancial(selectedPropertyId);

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [isPaid, setIsPaid] = useState(true);

    const handleSubmit = async () => {
        if (!description || !amount) return;

        await actions.registerOccurrence.mutateAsync({
            description,
            amount: parseFloat(amount),
            type,
            isPaid
        });

        setOpen(false);
        setDescription("");
        setAmount("");
        setType('expense');
        setIsPaid(true);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary hover:bg-primary/10">
                        <Plus className="h-4 w-4" /> Nova
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[22px] min-h-[50vh] p-6 max-w-md mx-auto">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-left text-lg font-bold flex items-center gap-2">
                        {type === 'expense' ? <ArrowDownCircle className="h-5 w-5 text-rose-500" /> : <ArrowUpCircle className="h-5 w-5 text-emerald-500" />}
                        Nova Movimentação
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">

                    <div className="flex bg-neutral-100 p-1 rounded-xl">
                        <button
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-neutral-400'}`}
                        >
                            SAÍDA (Despesa)
                        </button>
                        <button
                            onClick={() => setType('income')}
                            // Pending implementation of generic income
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-400 opacity-50 cursor-not-allowed'}`}
                            disabled
                        >
                            ENTRADA (Em breve)
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            placeholder="Ex: Compra de material, Pagamento extra..."
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                            placeholder="0,00"
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100 font-bold text-lg"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            type="number"
                            inputMode="decimal"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <span className="text-sm font-medium">Já foi pago?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={isPaid ? "default" : "outline"}
                                className={isPaid ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                                onClick={() => setIsPaid(true)}
                            >
                                Sim
                            </Button>
                            <Button
                                size="sm"
                                variant={!isPaid ? "default" : "outline"}
                                className={!isPaid ? "bg-amber-500 hover:bg-amber-600" : ""}
                                onClick={() => setIsPaid(false)}
                            >
                                Pendente
                            </Button>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl text-base font-bold mt-4"
                        onClick={handleSubmit}
                        disabled={!description || !amount || actions.registerOccurrence.isPending}
                    >
                        {actions.registerOccurrence.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Registrar"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
