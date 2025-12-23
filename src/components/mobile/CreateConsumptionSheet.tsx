import React, { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useHousekeeping } from "@/hooks/useHousekeeping";
import { toast } from "sonner";

interface CreateConsumptionSheetProps {
    bookingId: string;
    roomNumber: string;
    guestName: string;
    trigger?: React.ReactNode;
}

export const CreateConsumptionSheet: React.FC<CreateConsumptionSheetProps> = ({
    bookingId,
    roomNumber,
    guestName,
    trigger
}) => {
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState(1);

    const { addConsumption } = useHousekeeping();

    const handleSubmit = async () => {
        if (!item || !price) {
            toast.error("Preencha o item e o valor");
            return;
        }

        try {
            await addConsumption.mutateAsync({
                reservationId: bookingId,
                items: [{
                    name: item,
                    price: Number(price),
                    quantity: quantity
                }]
            });
            setOpen(false);
            // Reset form
            setItem("");
            setPrice("");
            setQuantity(1);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao registrar consumo");
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="w-full">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Lançar Consumo
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90dvh] rounded-t-[20px] px-5 max-w-md mx-auto">
                <SheetHeader className="text-left mb-6">
                    <SheetTitle className="text-xl font-bold text-neutral-900">
                        Lançar Consumo
                    </SheetTitle>
                    <p className="text-sm text-neutral-500">
                        Quarto {roomNumber} • {guestName}
                    </p>
                </SheetHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Item / Produto</Label>
                        <Input
                            placeholder="Ex: Água sem gás"
                            value={item}
                            onChange={(e) => setItem(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor Unit. (R$)</Label>
                            <Input
                                type="number"
                                placeholder="0,00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <div className="flex items-center h-12 border rounded-xl px-2 bg-white">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setQuantity(q => q + 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-neutral-500">Total do Lançamento</span>
                            <span className="text-lg font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price || 0) * quantity)}
                            </span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl font-bold text-md mt-4"
                        onClick={handleSubmit}
                        disabled={addConsumption.isPending}
                    >
                        {addConsumption.isPending ? "Lançando..." : "Confirmar Lançamento"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
