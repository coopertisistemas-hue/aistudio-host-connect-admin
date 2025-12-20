import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Service } from "@/hooks/useServices";
import { DollarSign, Users, CalendarDays, Edit, Trash2, ConciergeBell } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

const getStatusBadge = (status: Service['status']) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-success hover:bg-success/80">Ativo</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inativo</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ServiceCard = ({ service, onEdit, onDelete }: ServiceCardProps) => {
  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ConciergeBell className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">{service.name}</CardTitle>
        </div>
        {getStatusBadge(service.status)}
      </CardHeader>

      <CardContent className="space-y-4">
        {service.description && (
          <CardDescription className="line-clamp-2">
            {service.description}
          </CardDescription>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span>Preço: R$ {service.price.toFixed(2)}</span>
          </div>
          {service.is_per_person && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>Por pessoa</span>
            </div>
          )}
          {service.is_per_day && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span>Por dia</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(service)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(service.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;