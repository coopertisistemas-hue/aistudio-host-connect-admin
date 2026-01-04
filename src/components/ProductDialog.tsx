import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Save } from "lucide-react";
import { InventoryItem, InventoryItemInput } from "@/hooks/useInventory";

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: InventoryItemInput) => Promise<void>;
    isLoading: boolean;
    initialData?: InventoryItem | null;
}

export const ProductDialog = ({ open, onOpenChange, onSubmit, isLoading, initialData }: ProductDialogProps) => {
    const [formData, setFormData] = useState<InventoryItemInput>({
        name: "",
        category: "Geral",
        price: 0,
        description: "",
        is_for_sale: true,
        unit: "UN",
        min_stock: 5
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                category: initialData.category,
                price: initialData.price,
                description: initialData.description || "",
                is_for_sale: initialData.is_for_sale,
                unit: initialData.unit || "UN",
                min_stock: initialData.min_stock || 5
            });
        } else {
            setFormData({
                name: "",
                category: "Geral",
                price: 0,
                description: "",
                is_for_sale: true,
                unit: "UN",
                min_stock: 5
            });
        }
    }, [initialData, open]);

    const handleChange = (field: keyof InventoryItemInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const categories = ["Geral", "Bebidas", "Alimentos", "Higiene", "Souvenirs", "Outros"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        {initialData ? "Editar Produto" : "Novo Produto"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="Ex: Água Mineral 500ml"
                                className="h-11"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val) => handleChange("category", val)}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Preço de Venda (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                                    className="h-11 font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unidade</Label>
                                <Input
                                    id="unit"
                                    value={formData.unit}
                                    onChange={(e) => handleChange("unit", e.target.value)}
                                    placeholder="Ex: UN, LT, KG"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                                <Input
                                    id="min_stock"
                                    type="number"
                                    min="0"
                                    value={formData.min_stock}
                                    onChange={(e) => handleChange("min_stock", parseInt(e.target.value) || 0)}
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-base">Disponível para Venda</Label>
                                <p className="text-xs text-muted-foreground">
                                    Se ativado, aparecerá no PDV.
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_for_sale}
                                onCheckedChange={(val) => handleChange("is_for_sale", val)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onSubmit(formData)}
                        disabled={isLoading || !formData.name}
                        className="w-32"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
