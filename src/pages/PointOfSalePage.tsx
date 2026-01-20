import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, CreditCard, Loader2, Plus, Trash2, SlidersHorizontal, PackageOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useInventory, InventoryItem, InventoryItemInput } from "@/hooks/useInventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";
import { ProductDialog } from "@/components/ProductDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStock } from "@/hooks/useStock";
import { useAuth } from "@/hooks/useAuth";

// Types for Cart
type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

const PointOfSalePage = () => {
    const queryClient = useQueryClient();
    const { items, isLoading: loadingCatalog, createItem, updateItem } = useInventory();
    const { stock } = useStock('pantry'); // For future stock validation if needed
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);

    // Booking State
    const [activeBookings, setActiveBookings] = useState<any[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Fetch Active Bookings
    useEffect(() => {
        const fetchActiveBookings = async () => {
            setLoadingBookings(true);
            const { data, error } = await supabase
                .from('bookings')
                .select('*, room:rooms(name, room_number), guest:guests(full_name)')
                .eq('status', 'checked_in');

            if (!error && data) {
                setActiveBookings(data);
            }
            setLoadingBookings(false);
        };
        fetchActiveBookings();
    }, []);

    // Filter Logic
    const categories = ["all", ...Array.from(new Set(items.map(i => i.category)))];

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Only show items that are marked for sale in the main grid
    // If user wants to edit hidden items, we can add a toggle later
    const sellableItems = filteredItems.filter(item => item.is_for_sale);


    // Cart Logic
    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const emptyCart = () => setCart([]);

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // CRUD Logic
    const handleSaveProduct = async (data: InventoryItemInput) => {
        if (isViewer) return;
        if (editingItem) {
            await updateItem.mutateAsync({ id: editingItem.id, item: data });
        } else {
            await createItem.mutateAsync(data);
        }
        setDialogOpen(false);
        setEditingItem(null);
    };

    const handleEditClick = (e: React.MouseEvent, item: InventoryItem) => {
        if (isViewer) return;
        e.stopPropagation();
        setEditingItem(item);
        setDialogOpen(true);
    };

    const handleNewClick = () => {
        if (isViewer) return;
        setEditingItem(null);
        setDialogOpen(true);
    }

    // Process Sale
    const processSale = async () => {
        if (isViewer) return;
        if (!selectedBookingId || cart.length === 0) return;
        setIsProcessing(true);

        try {
            // Fetch booking details to get property_id
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select('property_id')
                .eq('id', selectedBookingId)
                .single();

            if (bookingError || !booking?.property_id) throw new Error("Erro ao buscar detalhes da reserva.");

            const propertyId = booking.property_id;

            const expenses = cart.map(item => ({
                booking_id: selectedBookingId,
                description: `PDV: ${item.name} (x${item.quantity})`,
                amount: item.price * item.quantity,
                category: 'consumo_bar',
                property_id: propertyId,
                expense_date: new Date().toISOString()
            }));

            const { error: expenseError } = await supabase
                .from('expenses')
                .insert(expenses as any); // Type assertion for joined fields

            if (expenseError) throw expenseError;

            // Decrement Stock
            for (const item of cart) {
                const currentStock = stock.find(s => s.item_id === item.id);
                if (currentStock && currentStock.quantity > 0) {
                    await supabase
                        .from('item_stock' as any)
                        .update({ quantity: Math.max(0, currentStock.quantity - item.quantity) })
                        .eq('id', currentStock.id);
                }
            }

            toast({ title: "Venda realizada!", description: `Total: R$ ${totalAmount.toFixed(2)}` });
            setCart([]);
            setSelectedBookingId(null);
            queryClient.invalidateQueries({ queryKey: ['item_stock'] });

        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6">

                {/* Left: Product Catalog */}
                <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Ponto de Venda</h1>
                            <p className="text-muted-foreground">Selecione os itens para a comanda.</p>
                        </div>
                        <Button onClick={handleNewClick} className="rounded-xl shadow-lg shadow-primary/20" disabled={isViewer}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Produto
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar produtos..."
                                className="pl-10 border-none bg-transparent shadow-none focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-border mx-2" />
                        <div className="flex gap-2 overflow-x-auto max-w-[400px] scrollbar-hide pr-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    {cat === "all" ? "Todos" : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20 pr-2 content-start">
                        {!isViewer && (
                            <div
                                className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[140px] gap-2 text-muted-foreground hover:text-primary hover:border-primary/50"
                                onClick={handleNewClick}
                            >
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-medium">Cadastrar Novo</span>
                            </div>
                        )}

                        {sellableItems.map(item => (
                            <ProductCard
                                key={item.id}
                                item={item}
                                onClick={() => !isViewer && addToCart(item)}
                                onEdit={(e) => handleEditClick(e, item)}
                                isViewer={isViewer}
                            />
                        ))}
                    </div>
                </div>

                {/* Right: Smart Cart */}
                <div className="w-full lg:w-[420px] flex flex-col h-full bg-card rounded-3xl border shadow-xl overflow-hidden relative">
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-b from-muted/50 to-transparent border-b">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Carrinho</h2>
                                    <p className="text-xs text-muted-foreground">{cart.length} itens adicionados</p>
                                </div>
                            </div>
                            {cart.length > 0 && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={emptyCart} disabled={isViewer}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <Select value={selectedBookingId || ""} onValueChange={setSelectedBookingId} disabled={isViewer}>
                            <SelectTrigger className="w-full bg-background border-muted-foreground/20 h-11 rounded-xl">
                                <SelectValue placeholder="Selecione o Hóspede / Quarto" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeBookings.map(b => (
                                    <SelectItem key={b.id} value={b.id}>
                                        Quarto {b.room?.room_number} • {b.guest?.full_name}
                                    </SelectItem>
                                ))}
                                {activeBookings.length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground text-center">Nenhum check-in ativo</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-4">
                                <ShoppingCart className="h-16 w-16" />
                                <p className="text-sm font-medium">O carrinho está vazio</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/50 group hover:border-primary/30 transition-colors">
                                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center text-xs font-bold border border-border/50">
                                        x{item.quantity}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} un</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-bold text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        {!isViewer && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground"
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >
                                                    -
                                                </button>
                                                <button
                                                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground"
                                                    onClick={() => addToCart({ id: item.id } as any)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Total */}
                    <div className="p-6 bg-muted/30 border-t space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>R$ {totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-2xl font-black">
                                <span>Total</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                            size="lg"
                            disabled={cart.length === 0 || !selectedBookingId || isProcessing || isViewer}
                            onClick={processSale}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                            Confirmar Venda
                        </Button>
                    </div>
                </div>
            </div>

            <ProductDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSaveProduct}
                isLoading={createItem.isPending || updateItem.isPending}
                initialData={editingItem}
            />

        </DashboardLayout>
    );
};

export default PointOfSalePage;
