import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Minus,
    Plus,
    AlertTriangle,
    CheckCircle2,
    TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StockItem {
    item_id: string;
    quantity: number;
    item_details: {
        name: string;
        category: string;
        unit?: string;
        min_stock?: number;
    };
}

interface PantryItemCardProps {
    item: StockItem;
    onAdjust: (delta: number) => void;
    isUpdating: boolean;
}

export const PantryItemCard = ({ item, onAdjust, isUpdating }: PantryItemCardProps) => {
    // Determine status based on quantity (assuming min_stock is around 5 if not set)
    const minStock = item.item_details.min_stock || 5;
    const isLowStock = item.quantity <= minStock;
    const isOutOfStock = item.quantity === 0;

    const statusConfig = isOutOfStock
        ? { color: "border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-600/5", icon: AlertTriangle, iconColor: "text-rose-600", badge: "bg-rose-500/10 text-rose-700" }
        : isLowStock
            ? { color: "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5", icon: TrendingDown, iconColor: "text-amber-600", badge: "bg-amber-500/10 text-amber-700" }
            : { color: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5", icon: CheckCircle2, iconColor: "text-emerald-600", badge: "bg-emerald-500/10 text-emerald-700" };

    const StatusIcon = statusConfig.icon;

    return (
        <Card className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2",
            statusConfig.color
        )}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />
            </div>

            <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                        {item.item_details.category || 'Geral'}
                    </Badge>
                    {isLowStock && (
                        <Badge className={cn("border-none flex items-center gap-1", statusConfig.badge)}>
                            <StatusIcon className="h-3 w-3" />
                            {isOutOfStock ? "Esgotado" : "Baixo Estoque"}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm transition-colors",
                        isLowStock ? "bg-background/80" : "bg-primary/10"
                    )}>
                        <Package className={cn("h-6 w-6", isLowStock ? statusConfig.iconColor : "text-primary")} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate" title={item.item_details.name}>
                            {item.item_details.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimo ideal: {minStock} un
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-background/60 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onAdjust(-1)}
                        disabled={isUpdating || item.quantity === 0}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>

                    <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-xl font-bold leading-none tracking-tight">
                            {item.quantity}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                            {item.item_details.unit || 'UN'}
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => onAdjust(1)}
                        disabled={isUpdating}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>

            {/* Progress Bar for Stock Level visually */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                <div
                    className={cn("h-full transition-all duration-500", isLowStock ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${Math.min((item.quantity / (minStock * 2)) * 100, 100)}%` }} // Visual approximation
                />
            </div>
        </Card>
    );
};
