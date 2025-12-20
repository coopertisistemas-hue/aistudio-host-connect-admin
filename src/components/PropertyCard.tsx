import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEntityPhotos } from "@/hooks/useEntityPhotos"; // Changed import
import { Property } from "@/hooks/useProperties";
import { Building2, MapPin, Phone, Mail, BedDouble, Edit, Trash2, Image as ImageIcon } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const PropertyCard = ({ property, onEdit, onDelete }: PropertyCardProps) => {
  const { photos } = useEntityPhotos(property.id); // Pass property.id as entityId
  const primaryPhoto = photos.find(p => p.is_primary) || photos[0];

  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      {primaryPhoto ? (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={primaryPhoto.photo_url}
            alt={`Foto principal da propriedade ${property.name}`}
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
            <CardTitle className="text-xl mb-2">{property.name}</CardTitle>
            <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
              {property.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          <Building2 className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {property.description && (
          <CardDescription className="line-clamp-2">
            {property.description}
          </CardDescription>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {property.city}, {property.state}
            </span>
          </div>
          {property.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{property.phone}</span>
            </div>
          )}
          {property.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{property.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4 flex-shrink-0" />
            <span>{property.total_rooms} quartos</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(property)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(property.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;