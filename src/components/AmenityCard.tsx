import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Amenity } from "@/hooks/useAmenities";
import { Edit, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react"; // Import all Lucide icons

interface AmenityCardProps {
  amenity: Amenity;
  onEdit: (amenity: Amenity) => void;
  onDelete: (id: string) => void;
}

const AmenityCard = ({ amenity, onEdit, onDelete }: AmenityCardProps) => {
  const IconComponent = amenity.icon ? (LucideIcons as any)[amenity.icon] : LucideIcons.HelpCircle;

  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">{amenity.name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {amenity.description && (
          <CardDescription className="line-clamp-2">
            {amenity.description}
          </CardDescription>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(amenity)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(amenity.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmenityCard;