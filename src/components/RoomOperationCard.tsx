import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Room } from "@/hooks/useRooms";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { Bed, ArrowRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface RoomOperationCardProps {
    room: Room;
}

export const RoomOperationCard = ({ room }: RoomOperationCardProps) => {
    const navigate = useNavigate();

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => navigate(`/operation/rooms/${room.id}`)}
        >
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bed className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">{room.room_number}</CardTitle>
                        <p className="text-xs text-muted-foreground">{room.room_types?.name}</p>
                    </div>
                </div>
                <RoomStatusBadge status={room.status as any} />
            </CardHeader>

            <CardContent className="p-4 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {room.status === 'occupied' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>Hóspede In-house</span>
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
