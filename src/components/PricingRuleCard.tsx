import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PricingRule } from "@/hooks/usePricingRules";
import { Calendar, DollarSign, Tag, Edit, Trash2, BedDouble } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PricingRuleCardProps {
  rule: PricingRule;
  onEdit: (rule: PricingRule) => void;
  onDelete: (id: string) => void;
  isViewer?: boolean;
}

const PricingRuleCard = ({ rule, onEdit, onDelete, isViewer }: PricingRuleCardProps) => {
  const getStatusBadge = (status: PricingRule['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success hover:bg-success/80">Ativa</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriceDisplay = () => {
    if (rule.base_price_override !== null) {
      return `R$ ${rule.base_price_override.toFixed(2)}`;
    }
    if (rule.price_modifier !== null) {
      const modifierPercent = (rule.price_modifier * 100 - 100); // Calculate as number
      return `${modifierPercent > 0 ? '+' : ''}${modifierPercent.toFixed(0)}%`; // Format to string after comparison
    }
    return "N/A";
  };

  return (
    <Card className="hover:shadow-medium transition-all overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">{rule.promotion_name || "Regra de Precificação"}</CardTitle>
        </div>
        {getStatusBadge(rule.status)}
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="line-clamp-2">
          Aplicada à propriedade: <strong>{rule.properties?.name || 'N/A'}</strong>
          {rule.room_types?.name && (
            <>
              <br />
              Tipo de Acomodação: <strong>{rule.room_types.name}</strong>
            </>
          )}
        </CardDescription>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              Período: {format(new Date(rule.start_date), "dd/MM/yyyy", { locale: ptBR })} -{" "}
              {format(new Date(rule.end_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span>Preço: {getPriceDisplay()}</span>
          </div>
          {(rule.min_stay || rule.max_stay) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BedDouble className="h-4 w-4 flex-shrink-0" />
              <span>
                Estadia: {rule.min_stay ? `${rule.min_stay} noites (mín)` : ''}
                {rule.min_stay && rule.max_stay ? ' / ' : ''}
                {rule.max_stay ? `${rule.max_stay} noites (máx)` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => !isViewer && onEdit(rule)}
            disabled={isViewer}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => !isViewer && onDelete(rule.id)}
            disabled={isViewer}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingRuleCard;