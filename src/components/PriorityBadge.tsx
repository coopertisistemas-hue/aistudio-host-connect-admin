import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HousekeepingPriority } from "@/hooks/useHousekeeping";

interface PriorityBadgeProps {
    priority: HousekeepingPriority;
    className?: string;
}

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
    const getConfig = (p: HousekeepingPriority) => {
        switch (p) {
            case 'high':
                return { label: 'Alta (Saída)', className: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100" };
            case 'medium':
                return { label: 'Média (Chegada)', className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100" };
            case 'low':
                return { label: 'Rotina', className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" };
            default:
                return { label: p, className: "" };
        }
    };

    const config = getConfig(priority);

    return (
        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0 h-5", config.className, className)}>
            {config.label}
        </Badge>
    );
};
