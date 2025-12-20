import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room } from "@/hooks/useRooms";
import { Bed, Edit, Trash2, Tag } from "lucide-react";

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
}

const getStatusBadge = (status: Room['status']) => {
  switch (status) {
    case 'available':
      return <Badge variant="default" className="bg-success hover:bg-success/80">Disponível</Badge>;
    case 'occupied':
      return <Badge variant="destructive">Ocupado</Badge>;
    case 'maintenance':
      return <Badge variant="secondary">Manutenção</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const RoomCard = ({ room, onEdit, onDelete }: RoomCardProps) => {
  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bed className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">{room.room_number}</CardTitle>
        </div>
        {getStatusBadge(room.status)}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span>Tipo: {room.room_types?.name || 'N/A'}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(room)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(room.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;