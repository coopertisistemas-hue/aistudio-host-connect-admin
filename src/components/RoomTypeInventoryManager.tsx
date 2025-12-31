import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useRoomTypeInventory } from "@/hooks/useRoomTypeInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
    roomTypeId: string;
}

const RoomTypeInventoryManager = ({ roomTypeId }: Props) => {
    const { items: allItems, isLoading: loadingCatalog } = useInventory();
    const { inventory, isLoading: loadingInventory, addItem, updateQuantity, removeItem } = useRoomTypeInventory(roomTypeId);

    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);

    const handleAdd = async () => {
        if (!selectedItemId || quantity < 1) return;
        await addItem.mutateAsync({ itemId: selectedItemId, quantity });
        setSelectedItemId("");
        setQuantity(1);
    };

    const handleUpdate = async (id: string, newQty: number) => {
        if (newQty < 1) return;
        await updateQuantity.mutateAsync({ id, quantity: newQty });
    };

    if (loadingCatalog || loadingInventory) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    }

    // Filter out items already in inventory
    const availableItems = allItems.filter(
        item => !inventory.some(inv => inv.item_id === item.id)
    );

    return (
        <div className="space-y-6">
            <div className="border p-4 rounded-lg bg-muted/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Adicionar Item ao Inventário
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Label className="text-xs mb-1.5 block">Item do Catálogo</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um item..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableItems.length === 0 ? (
                                    <SelectItem value="none" disabled>Todos itens já adicionados</SelectItem>
                                ) : (
                                    availableItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} ({item.category})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-24">
                        <Label className="text-xs mb-1.5 block">Qtd.</Label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={!selectedItemId || addItem.isPending}>
                        {addItem.isPending ? "..." : "Adicionar"}
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="w-[100px]">Quantidade</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                    Nenhum item vinculado a este tipo de acomodação.
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventory.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">
                                        {inv.item_details?.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{inv.item_details?.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="1"
                                            className="h-8 w-16"
                                            defaultValue={inv.quantity}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val !== inv.quantity) handleUpdate(inv.id, val);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                            onClick={() => removeItem.mutate(inv.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                * A quantidade definida aqui é "por unidade" (ex: Cada quarto deste tipo terá X toalhas).
            </p>
        </div>
    );
};

export default RoomTypeInventoryManager;
