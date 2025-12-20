import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEntityPhotos } from "@/hooks/useEntityPhotos"; // Changed import
import { RoomType } from "@/hooks/useRoomTypes";
import { BedDouble, Users, DollarSign, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import * as LucideIcons from "lucide-react"; // Import all Lucide icons

interface RoomTypeCardProps {
  roomType: RoomType;
  onEdit: (roomType: RoomType) => void;
  onDelete: (id: string) => void;
}

const RoomTypeCard = ({ roomType, onEdit, onDelete }: RoomTypeCardProps) => {
  const { photos } = useEntityPhotos(roomType.id); // Pass roomType.id as entityId
  const primaryPhoto = photos.find(p => p.is_primary) || photos[0];

  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      {primaryPhoto ? (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={primaryPhoto.photo_url}
            alt={`Foto principal do tipo de acomodação ${roomType.name}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{roomType.name}</CardTitle>
            <Badge variant={roomType.status === 'active' ? 'default' : 'secondary'}>
              {roomType.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <BedDouble className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {roomType.description && (
          <CardDescription className="line-clamp-2">
            {roomType.description}
          </CardDescription>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Capacidade: {roomType.capacity} hóspedes</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span>Preço Base: R$ {roomType.base_price.toFixed(2)} / noite</span>
          </div>
        </div>

        {roomType.amenity_details && roomType.amenity_details.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Comodidades:</p>
            <div className="flex flex-wrap gap-2">
              {roomType.amenity_details.map((amenity) => {
                const AmenityIcon = amenity.icon ? (LucideIcons as any)[amenity.icon] : LucideIcons.HelpCircle;
                return (
                  <Badge key={amenity.id} variant="outline" className="flex items-center gap-1">
                    <AmenityIcon className="h-3 w-3" />
                    {amenity.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(roomType)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(roomType.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomTypeCard;