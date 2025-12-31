import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, Minus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStock } from "@/hooks/useStock";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PantryStockPage = () => {
    const { stock, isLoading, updateStock } = useStock('pantry');
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    const categories = Array.from(new Set(stock.map(s => s.item_details?.category || "Geral")));

    const filteredStock = stock.filter((s) => {
        const matchesSearch = s.item_details?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || s.item_details?.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAdjust = (itemId: string, currentQty: number, delta: number) => {
        const newQty = Math.max(0, currentQty + delta);
        updateStock.mutate({ itemId, quantity: newQty });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Estoque da Copa</h1>
                        <p className="text-muted-foreground mt-1">
                            Controle a quantidade de itens disponíveis no estoque central.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar item..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Categorias</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stock Grid */}
                {isLoading ? (
                    <DataTableSkeleton />
                ) : filteredStock.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">{searchQuery ? "Nenhum item encontrado" : "Inventário Vazio"}</h3>
                            <p className="text-muted-foreground text-center max-w-md mb-4">
                                Certifique-se de cadastrar itens no "Inventário de Acomodação" primeiro.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredStock.map((item) => (
                            <Card key={item.item_id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="mb-2">
                                            {item.item_details?.category || 'Geral'}
                                        </Badge>
                                        {item.quantity < 5 && (
                                            <Badge variant="destructive" className="text-[10px]">Baixo Estoque</Badge>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-lg truncate" title={item.item_details?.name}>
                                        {item.item_details?.name}
                                    </h3>

                                    <div className="mt-4 flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleAdjust(item.item_id, item.quantity, -1)}
                                            disabled={updateStock.isPending}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>

                                        <div className="text-center min-w-[60px]">
                                            <span className="text-2xl font-bold block leading-none">
                                                {item.quantity}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">
                                                Unidades
                                            </span>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleAdjust(item.item_id, item.quantity, 1)}
                                            disabled={updateStock.isPending}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PantryStockPage;
