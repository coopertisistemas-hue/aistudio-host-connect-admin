import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    label: string;
    value: string | number;
    description?: string;
    variant?: 'default' | 'rose' | 'amber' | 'emerald' | 'blue';
    className?: string;
}

export const KpiCard = ({ label, value, description, variant = 'default', className }: KpiCardProps) => {
    const variants = {
        default: "bg-card text-card-foreground",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
    };

    const labelColors = {
        default: "text-muted-foreground",
        rose: "text-rose-400",
        amber: "text-amber-400",
        emerald: "text-emerald-400",
        blue: "text-blue-400",
    };

    return (
        <Card className={cn("border-none shadow-sm", variants[variant], className)}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold">{value}</span>
                <span className={cn("text-[10px] uppercase font-bold tracking-wider", labelColors[variant])}>
                    {label}
                </span>
                {description && (
                    <span className="text-[10px] mt-1 opacity-70 italic">{description}</span>
                )}
            </CardContent>
        </Card>
    );
};
