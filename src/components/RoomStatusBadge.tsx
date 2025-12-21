import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RoomOperationalStatus } from "@/hooks/useRoomOperation";

interface RoomStatusBadgeProps {
    status: RoomOperationalStatus | string;
    className?: string;
}

export const RoomStatusBadge = ({ status, className }: RoomStatusBadgeProps) => {
    const getStatusConfig = (s: string) => {
        switch (s) {
            case 'available':
            case 'clean':
                return { label: s === 'available' ? 'Disponível' : 'Limpo', className: "bg-emerald-500 hover:bg-emerald-600 text-white border-none" };
            case 'occupied':
                return { label: 'Ocupado', className: "bg-blue-500 hover:bg-blue-600 text-white border-none" };
            case 'dirty':
                return { label: 'Sujo', className: "bg-rose-500 hover:bg-rose-600 text-white border-none" };
            case 'inspected':
                return { label: 'Inspecionado', className: "bg-indigo-500 hover:bg-indigo-600 text-white border-none" };
            case 'maintenance':
            case 'ooo':
                return { label: s === 'maintenance' ? 'Manutenção' : 'Fora de Serviço', className: "bg-slate-500 hover:bg-slate-600 text-white border-none" };
            default:
                return { label: s, className: "" };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge className={cn("font-medium", config.className, className)}>
            {config.label}
        </Badge>
    );
};
