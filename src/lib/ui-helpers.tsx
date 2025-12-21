import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, CheckCheck } from "lucide-react";
import React from "react";

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export const getStatusBadge = (status: BookingStatus) => {
  const statusConfig = {
    confirmed: { label: "Confirmada", variant: "default" as const, icon: CheckCircle2, color: "text-success" },
    pending: { label: "Pendente", variant: "secondary" as const, icon: Clock, color: "text-muted-foreground" },
    cancelled: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-destructive" },
    completed: { label: "Concluída", variant: "outline" as const, icon: CheckCircle2, color: "text-primary" },
  };

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
};