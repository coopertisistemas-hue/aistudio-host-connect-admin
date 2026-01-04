import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Room } from "@/hooks/useRooms";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { Bed, ArrowRight, User, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface RoomOperationCardProps {
    room: Room;
}

export const RoomOperationCard = ({ room }: RoomOperationCardProps) => {
    const navigate = useNavigate();

    const statusColorMap = {
        available: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20",
        occupied: "from-rose-500/10 to-rose-600/10 border-rose-500/20",
        dirty: "from-amber-500/10 to-amber-600/10 border-amber-500/20",
        clean: "from-blue-500/10 to-blue-600/10 border-blue-500/20",
        inspected: "from-purple-500/10 to-purple-600/10 border-purple-500/20",
        ooo: "from-slate-500/10 to-slate-600/10 border-slate-500/20",
        maintenance: "from-orange-500/10 to-orange-600/10 border-orange-500/20",
    };

    const gradientClass = statusColorMap[room.status as keyof typeof statusColorMap] || statusColorMap.available;

    return (
        <Card
            className={`group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] border-2 bg-gradient-to-br ${gradientClass} overflow-hidden relative`}
            onClick={() => navigate(`/operation/rooms/${room.id}`)}
        >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between space-y-0 relative z-10">
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Bed className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold tracking-tight">
                            Quarto {room.room_number}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium truncate">
                            {room.room_types?.name || 'Sem categoria'}
                        </p>
                    </div>
                </div>
                <RoomStatusBadge status={room.status as any} />
            </CardHeader>

            <CardContent className="p-5 pt-2 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {room.status === 'occupied' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/60 backdrop-blur-sm rounded-full border shadow-sm">
                                <User className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-semibold">In-house</span>
                            </div>
                        )}
                        {room.status === 'clean' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/60 backdrop-blur-sm rounded-full border shadow-sm">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-600">Pronto</span>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                    >
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
