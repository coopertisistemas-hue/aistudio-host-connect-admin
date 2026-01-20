import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Package, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useInventory, InventoryItemInput } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const CATEGORIES = [
    "Bedding (Cama)",
    "Bath (Banho)",
    "Electronics (Eletrônicos)",
    "Furniture (Móveis)",
    "Kitchen (Cozinha)",
    "Minibar (Frigobar)",
    "Toiletries (Amenidades)",
    "Geral"
];

const InventoryPage = () => {
    const { items, isLoading, createItem, deleteItem } = useInventory();
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';

    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newItem, setNewItem] = useState<InventoryItemInput>({
        name: "",
        category: "Geral",
        description: ""
    });

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (isViewer) return;
        if (!newItem.name) return;
        await createItem.mutateAsync(newItem);
        setDialogOpen(false);
        setNewItem({ name: "", category: "Geral", description: "", price: 0, is_for_sale: false });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Inventário de Acomodação</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie o catálogo de itens físicos (ex: Roupas de Cama, Equipamentos).
                        </p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="hero" disabled={isViewer}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Item de Inventário</DialogTitle>
                                <DialogDescription>
                                    Cadastre um item físico para controlar nas acomodações.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome do Item</Label>
                                    <Input
                                        placeholder="Ex: Toalha de Banho Premium"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select
                                        value={newItem.category}
                                        onValueChange={(val) => setNewItem({ ...newItem, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="is_for_sale"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={newItem.is_for_sale}
                                            onChange={(e) => setNewItem({ ...newItem, is_for_sale: e.target.checked })}
                                        />
                                        <Label htmlFor="is_for_sale" className="cursor-pointer">Item Disponível para Venda (PDV/Frigobar)</Label>
                                    </div>

                                    {newItem.is_for_sale && (
                                        <div className="space-y-2">
                                            <Label>Preço de Venda (R$)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={newItem.price}
                                                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição (Opcional)</Label>
                                    <Input
                                        placeholder="Detalhes adicionais..."
                                        value={newItem.description || ''}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreate} disabled={createItem.isPending || !newItem.name}>
                                    {createItem.isPending ? "Salvando..." : "Salvar Item"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou categoria..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* List */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6">
                                <DataTableSkeleton />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Nenhum item cadastrado</h3>
                                <p className="text-muted-foreground">Comece criando seu catálogo de objetos.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Preço</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {item.is_for_sale ? (
                                                    <span className="font-semibold text-green-600">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Interno</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => !isViewer && deleteItem.mutate(item.id)}
                                                    disabled={isViewer}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default InventoryPage;
