import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    Coffee,
    Utensils,
    Sparkles,
    Gift,
    MoreHorizontal,
    Edit2,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/hooks/useInventory";

interface ProductCardProps {
    item: InventoryItem;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    isViewer?: boolean;
}

export const ProductCard = ({ item, onClick, onEdit, isViewer }: ProductCardProps) => {

    const getCategoryStyle = (category: string) => {
        const styles: Record<string, { color: string, icon: any, bg: string }> = {
            "Bebidas": { color: "text-blue-600", icon: Coffee, bg: "bg-blue-100 dark:bg-blue-900/30" },
            "Alimentos": { color: "text-orange-600", icon: Utensils, bg: "bg-orange-100 dark:bg-orange-900/30" },
            "Higiene": { color: "text-emerald-600", icon: Sparkles, bg: "bg-emerald-100 dark:bg-emerald-900/30" },
            "Souvenirs": { color: "text-purple-600", icon: Gift, bg: "bg-purple-100 dark:bg-purple-900/30" },
        };
        return styles[category] || { color: "text-slate-600", icon: Package, bg: "bg-slate-100 dark:bg-slate-800" };
    };

    const style = getCategoryStyle(item.category);
    const Icon = style.icon;

    return (
        <Card
            className="group relative cursor-pointer overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 active:scale-[0.98]"
            onClick={onClick}
        >
            {/* Hover Actions */}
            {!isViewer && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-sm hover:bg-background"
                        onClick={onEdit}
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            <CardContent className="p-4 flex flex-col items-center text-center gap-3 pt-6">
                <div className={cn(
                    "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                    style.bg
                )}>
                    <Icon className={cn("h-8 w-8", style.color)} />
                </div>

                <div className="space-y-1 w-full">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                        {item.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50">
                            {item.unit || "UN"}
                        </Badge>
                        <span className="text-lg font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </span>
                    </div>
                </div>

                {/* Add Overlay Effect */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </CardContent>
        </Card>
    );
};
