import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CheckCheck, Clock, XCircle } from "lucide-react";
import { BookingStatus, BookingStatusValue, toCanonicalBookingStatus } from "@/lib/constants/statuses";

export const getStatusBadge = (status: BookingStatusValue | string) => {
  const statusConfig = {
    [BookingStatus.RESERVED]: { label: "Reservada", variant: "secondary" as const, icon: Clock, color: "text-muted-foreground" },
    [BookingStatus.PRE_CHECKIN]: { label: "Pre-check-in", variant: "secondary" as const, icon: Clock, color: "text-muted-foreground" },
    [BookingStatus.CHECKED_IN]: { label: "Check-in", variant: "default" as const, icon: CheckCheck, color: "text-success" },
    [BookingStatus.IN_HOUSE]: { label: "Hospedado", variant: "default" as const, icon: CheckCircle2, color: "text-success" },
    [BookingStatus.CHECKED_OUT]: { label: "Check-out", variant: "outline" as const, icon: CheckCircle2, color: "text-primary" },
    [BookingStatus.CANCELLED]: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-destructive" },
    [BookingStatus.NO_SHOW]: { label: "No-show", variant: "destructive" as const, icon: XCircle, color: "text-destructive" },
  };

  const config = statusConfig[toCanonicalBookingStatus(status)];
  if (!config) return null;

  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
};
