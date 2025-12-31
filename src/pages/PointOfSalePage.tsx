import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, CalendarRange, User, CreditCard, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useInventory } from "@/hooks/useInventory";
import { useBookings } from "@/hooks/useBookings"; // Assuming this exists or similar
import { useStock } from "@/hooks/useStock";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types for Cart
type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

const PointOfSalePage = () => {
    const queryClient = useQueryClient();
    const { items, isLoading: loadingCatalog } = useInventory();
    const { stock } = useStock('pantry'); // To check availability (optional, for visual cue)

    // Fetch active bookings for selection
    // NOTE: Assuming useBookings returns all or filtered. 
    // For POS, we specifically need "Checked In" bookings.
    // Implementing a custom query here for speed/specificity or reusing exsiting if robust.
    // Using a simplified custom query for Active Bookings logic
    const [activeBookings, setActiveBookings] = useState<any[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Load bookings on mount or distinct step
    // Getting active bookings logic
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

    // Trigger fetch on mount
    useState(() => { fetchActiveBookings(); });


    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const saleItems = items.filter(i => i.is_for_sale);

    const filteredItems = saleItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const processSale = async () => {
        if (!selectedBookingId || cart.length === 0) return;
        setIsProcessing(true);

        try {
            // 1. Create Expense Records
            const expenses = cart.map(item => ({
                booking_id: selectedBookingId,
                description: `PDV: ${item.name} (x${item.quantity})`,
                amount: item.price * item.quantity,
                category: 'consumo_bar', // assuming this category exists enum
                date: new Date().toISOString()
            }));

            const { error: expenseError } = await supabase
                .from('expenses') // Verify table name, usually 'expenses' or 'booking_expenses'
                .insert(expenses);

            if (expenseError) throw expenseError;

            // 2. Decrement Stock (Optional: Best effort)
            // We iterate and decrement. Ideally Rpc or backend trigger, but frontend loop works for MVP
            for (const item of cart) {
                // Find current stock
                const currentStock = stock.find(s => s.item_id === item.id);
                if (currentStock) {
                    const newQty = Math.max(0, currentStock.quantity - item.quantity);
                    await supabase
                        .from('item_stock')
                        .update({ quantity: newQty })
                        .eq('id', currentStock.id);
                }
            }

            toast({ title: "Venda realizada com sucesso!", description: `Total: R$ ${totalAmount.toFixed(2)}` });
            setCart([]);
            setSelectedBookingId(null);
            queryClient.invalidateQueries({ queryKey: ['item_stock'] });

        } catch (error: any) {
            toast({ title: "Erro ao processar venda", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-4">

                {/* Left: Product Catalog */}
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                    <div>
                        <h1 className="text-2xl font-bold">Ponto de Venda</h1>
                        <p className="text-muted-foreground">Selecione itens para adicionar à comanda.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar produto..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20 pr-2">
                        {filteredItems.map(item => (
                            <Card
                                key={item.id}
                                className="cursor-pointer hover:border-primary transition-colors text-center"
                                onClick={() => addToCart(item)}
                            >
                                <CardContent className="p-4 flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                                        <span className="text-green-600 font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right: Cart & Checkout */}
                <div className="w-full lg:w-[400px] border-l pl-0 lg:pl-4 flex flex-col h-full">
                    <Card className="flex flex-col h-full shadow-lg border-2">
                        <CardHeader className="bg-muted/20 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Carrinho
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10 opacity-50">
                                    Carrinho vazio
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded border">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                R$ {item.price.toFixed(2)} un.
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                                            <span className="w-4 text-center text-sm">{item.quantity}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                                        </div>
                                        <div className="w-16 text-right font-bold text-sm">
                                            R$ {(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>

                        <div className="p-4 border-t bg-muted/20 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Selecione o Quarto/Hóspede:</label>
                                <select
                                    className="w-full p-2 border rounded text-sm min-h-[40px]"
                                    value={selectedBookingId || ""}
                                    onChange={(e) => setSelectedBookingId(e.target.value)}
                                >
                                    <option value="">-- Selecione --</option>
                                    {activeBookings.map(b => (
                                        <option key={b.id} value={b.id}>
                                            Quarto {b.room?.room_number} - {b.guest?.full_name}
                                        </option>
                                    ))}
                                </select>
                                {activeBookings.length === 0 && !loadingBookings && (
                                    <p className="text-xs text-destructive">Nenhum hóspede "Check-in" encontrado.</p>
                                )}
                            </div>

                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total:</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span>
                            </div>

                            <Button
                                className="w-full h-12 text-lg"
                                disabled={cart.length === 0 || !selectedBookingId || isProcessing}
                                onClick={processSale}
                            >
                                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                Confirmar Venda
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PointOfSalePage;
