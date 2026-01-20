import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    ShoppingBasket,
    Plus,
    X,
    PackageOpen,
    TrendingDown,
    LayoutGrid,
    AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStock } from "@/hooks/useStock";
import { useAuth } from "@/hooks/useAuth";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { PantryItemCard, StockItem } from "@/components/PantryItemCard";
import { useNavigate } from "react-router-dom";

const PantryStockPage = () => {
    const { stock, isLoading, updateStock } = useStock('pantry');
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';

    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const navigate = useNavigate();

    // Safely map stock items to ensure they match StockItem interface
    const safeStock: StockItem[] = stock.map(s => ({
        item_id: s.item_id,
        quantity: s.quantity,
        item_details: {
            name: s.item_details?.name || 'Item Desconhecido',
            category: s.item_details?.category || 'Geral',
            unit: s.item_details?.unit,
            min_stock: s.item_details?.min_stock,
        }
    }));

    const categories = Array.from(new Set(safeStock.map(s => s.item_details.category)));

    const filteredStock = safeStock.filter((s) => {
        const matchesSearch = s.item_details.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || s.item_details.category === filterCategory;
        const matchesLowStock = filterCategory === "low_stock" ? s.quantity <= (s.item_details.min_stock || 5) : true;

        return matchesSearch && (filterCategory === "low_stock" ? matchesLowStock : matchesCategory);
    });

    const handleAdjust = (itemId: string, currentQty: number, delta: number) => {
        if (isViewer) return;
        const newQty = Math.max(0, currentQty + delta);
        updateStock.mutate({ itemId, quantity: newQty });
    };

    // KPIs
    const totalItems = safeStock.length;
    const lowStockCount = safeStock.filter(s => s.quantity <= (s.item_details.min_stock || 5)).length;
    const totalUnits = safeStock.reduce((acc, curr) => acc + curr.quantity, 0);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Sprint 1: Header Premium */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center backdrop-blur-sm border-2 border-emerald-500/30">
                                <ShoppingBasket className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Estoque da Copa</h1>
                                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Controle Central • Inventário em Tempo Real
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Future: Add 'New Item' button here if needed */}
                        </div>
                    </div>
                </div>

                {/* Sprint 2: KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Baixo Estoque */}
                    <Card className="border-none bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default group relative">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Atenção
                                    </p>
                                    <p className="text-5xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                                        {lowStockCount}
                                    </p>
                                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
                                        Itens com estoque baixo
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                                    <TrendingDown className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Itens Unicos */}
                    <Card className="border-none bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default group relative">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                        <LayoutGrid className="h-4 w-4" />
                                        Variedade
                                    </p>
                                    <p className="text-5xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                                        {totalItems}
                                    </p>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                                        Itens cadastrados
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <PackageOpen className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Unidades */}
                    <Card className="border-none bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default group relative">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingBasket className="h-4 w-4" />
                                        Volume Total
                                    </p>
                                    <p className="text-5xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                                        {totalUnits}
                                    </p>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                                        Unidades em estoque
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <ShoppingBasket className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sprint 3: Search & Filters */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar itens..."
                                className="pl-11 pr-10 h-12 bg-card/50 border-2 focus-visible:border-primary/50 focus-visible:bg-card focus-visible:shadow-lg rounded-xl transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center transition-colors"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 p-1 bg-muted/30 rounded-xl overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setFilterCategory("all")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterCategory === "all" ? 'bg-white dark:bg-slate-800 text-primary shadow-sm scale-105 font-semibold' : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterCategory("low_stock")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${filterCategory === "low_stock" ? 'bg-rose-100 text-rose-700 shadow-sm scale-105 font-semibold' : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'}`}
                            >
                                <AlertCircle className="h-3 w-3" />
                                Baixo Estoque
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterCategory === cat ? 'bg-white dark:bg-slate-800 text-primary shadow-sm scale-105 font-semibold' : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                {isLoading ? (
                    <DataTableSkeleton rows={8} variant="pantry" />
                ) : filteredStock.length === 0 ? (
                    <div className="relative py-24 text-center rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-background border-2 border-dashed overflow-hidden mt-6">
                        <div className="absolute inset-0 opacity-[0.03]">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                backgroundSize: '48px 48px'
                            }} />
                        </div>
                        <div className="relative z-10 space-y-6 px-4">
                            <div className="mx-auto h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                                <PackageOpen className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-2 max-w-md mx-auto">
                                <h3 className="text-2xl font-bold">Nenhum item encontrado</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {searchQuery ? `Não encontramos itens que correspondam a "${searchQuery}".` : "O estoque está vazio ou nenhum item pertence a esta categoria."}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredStock.map((item) => (
                            <PantryItemCard
                                key={item.item_id}
                                item={item}
                                onAdjust={(delta) => handleAdjust(item.item_id, item.quantity, delta)}
                                isUpdating={updateStock.isPending}
                                isViewer={isViewer}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PantryStockPage;
