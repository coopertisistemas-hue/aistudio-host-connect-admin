import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MoreVertical } from 'lucide-react';
import {
  getStatusLabel,
  getStatusVariant,
  RoomStatus,
  useUpdateRoomStatus,
} from '@/hooks/useUpdateRoomStatus';
import { Room } from '@/hooks/useRooms';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '@/lib/featureFlags';

type RoomWithExtras = Room & {
  name?: string | null;
  notes?: string | null;
  observation?: string | null;
  observacao?: string | null;
  out_of_order_reason?: string | null;
  maintenance_reason?: string | null;
};

const checklistItems = [
  'Cama arrumada',
  'Banheiro higienizado',
  'Lixo removido',
  'Toalhas repostas',
  'Piso limpo',
];

const roleLabels: Record<string, string> = {
  admin: 'admin',
  owner: 'proprietário',
  manager: 'gerência',
  staff_frontdesk: 'recepção',
  staff_housekeeping: 'governança',
  viewer: 'visualização',
  super_admin: 'suporte',
  unknown: 'equipe',
};

interface MobileRoomCardProps {
  room: RoomWithExtras;
  propertyId: string;
  isViewer: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (roomId: string) => void;
  createDemand?: {
    mutateAsync: (payload: {
      title: string;
      description: string | null;
      category: string;
      priority: string;
      status: string;
      impact_operation: boolean;
      room_id: string;
    }) => Promise<unknown>;
  };
}

const MobileRoomCard = ({
  room,
  propertyId,
  isViewer,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  createDemand,
}: MobileRoomCardProps) => {
  const updateStatus = useUpdateRoomStatus({ suppressToast: true });
  const { userRole, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [actionInFlight, setActionInFlight] = useState<null | 'status' | 'maintenance'>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceCategory, setMaintenanceCategory] = useState('Elétrica');
  const [maintenancePriority, setMaintenancePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [maintenanceImpact, setMaintenanceImpact] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [checklistState, setChecklistState] = useState<boolean[]>(
    () => checklistItems.map(() => false),
  );
  const currentStatus = room.status as RoomStatus;

  const observation = useMemo(() => {
    const candidates = [room.notes, room.observation, room.observacao];
    return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || '';
  }, [room.notes, room.observation, room.observacao]);

  const outOfOrderReason =
    room.out_of_order_reason ||
    room.maintenance_reason ||
    'Indisponível para manutenção.';

  const checklistComplete = useMemo(
    () => checklistState.every((isChecked) => isChecked),
    [checklistState],
  );

  const checklistEnabled = isFeatureEnabled('HK_CHECKLIST');
  const maintenanceEnabled = isFeatureEnabled('HK_MAINTENANCE');
  const showChecklist = checklistEnabled && (currentStatus === 'cleaning' || currentStatus === 'clean');
  const updatedAt = room.updated_at ?? null;
  const auditLogPath = '/admin/audit-log';

  const getRelativeTime = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (diffSeconds < 60) return 'agora';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d`;
  };

  const relativeTime = getRelativeTime(updatedAt);
  const updatedLabel = relativeTime ? `Atualizado há ${relativeTime}` : 'Atualização indisponível';
  const safeRoleLabel = isSuperAdmin
    ? roleLabels.super_admin
    : roleLabels[userRole ?? 'unknown'] ?? roleLabels.unknown;
  const canViewAuditLogRole = userRole === 'admin' || userRole === 'owner' || isSuperAdmin;

  useEffect(() => {
    setChecklistState(checklistItems.map(() => false));
  }, [room.id]);

  useEffect(() => {
    if (!showChecklist) {
      setChecklistState(checklistItems.map(() => false));
    }
  }, [showChecklist]);

  const primaryAction = useMemo(() => {
    if (isViewer) {
      return {
        label: 'Somente leitura',
        nextStatus: null,
        disabled: true,
        helper: 'Você não tem permissão para alterar o status.',
      };
    }

    switch (currentStatus) {
      case 'dirty':
        return { label: 'Iniciar limpeza', nextStatus: 'cleaning' as RoomStatus };
      case 'cleaning':
        return { label: 'Marcar como limpo', nextStatus: 'clean' as RoomStatus };
      case 'clean':
        if (checklistEnabled && !checklistComplete) {
          return {
            label: 'Marcar como em revisão',
            nextStatus: 'inspected' as RoomStatus,
            disabled: true,
            helper: 'Conclua o checklist antes de avançar.',
          };
        }
        return { label: 'Marcar como em revisão', nextStatus: 'inspected' as RoomStatus };
      case 'out_of_order':
        return {
          label: 'Fora de serviço',
          nextStatus: null,
          disabled: true,
          helper: outOfOrderReason,
        };
      case 'inspected':
        return {
          label: 'Confirmado',
          nextStatus: null,
          disabled: true,
          helper: 'Quarto já revisado.',
        };
      default:
        return {
          label: 'Confirmar',
          nextStatus: null,
          disabled: true,
          helper: 'Nenhuma ação disponível para este status.',
        };
    }
  }, [checklistComplete, checklistEnabled, currentStatus, isViewer, outOfOrderReason]);

  const isCardBusy = actionInFlight !== null;
  const isStatusSubmitting = actionInFlight === 'status';
  const isMaintenanceSubmitting = actionInFlight === 'maintenance';
  const isActionDisabled =
    isCardBusy || primaryAction.disabled || !primaryAction.nextStatus || selectionMode;
  const isNotesSupported = false;
  const isMaintenanceSupported = Boolean(createDemand?.mutateAsync) && maintenanceEnabled;
  const maintenanceCategoryOptions = [
    'Elétrica',
    'Hidráulica',
    'Ar-condicionado',
    'Enxoval',
    'Estrutural',
    'Outros',
  ];
  const maintenancePriorityOptions: { label: string; value: 'low' | 'medium' | 'high' }[] = [
    { label: 'Baixa', value: 'low' },
    { label: 'Média', value: 'medium' },
    { label: 'Alta', value: 'high' },
  ];

  const validateMaintenance = () => {
    const trimmed = maintenanceDescription.trim();
    const needsDescription = maintenancePriority === 'high' || maintenanceCategory === 'Outros';

    if (needsDescription && trimmed.length < 8) {
      return 'Adicione uma descrição com pelo menos 8 caracteres.';
    }

    return null;
  };

  const handlePrimaryAction = async () => {
    if (!primaryAction.nextStatus || isActionDisabled) return;
    setActionInFlight('status');

    try {
      await updateStatus.mutateAsync({
        roomId: room.id,
        newStatus: primaryAction.nextStatus,
        propertyId,
      });
      toast({
        title: 'Status atualizado com sucesso.',
      });
    } catch {
      toast({
        title: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setActionInFlight(null);
    }
  };

  const handleCardClick = () => {
    if (!selectionMode) return;
    onToggleSelect?.(room.id);
  };

  const handleOpenNotes = () => {
    setNoteOpen(true);
  };

  const handleOpenMaintenance = () => {
    if (!maintenanceEnabled) return;
    setMaintenanceError(null);
    setMaintenanceOpen(true);
  };

  const handleMaintenanceSubmit = async () => {
    if (!maintenanceEnabled) return;
    if (!isMaintenanceSupported || isMaintenanceSubmitting || !createDemand?.mutateAsync) return;
    const validationMessage = validateMaintenance();
    if (validationMessage) {
      setMaintenanceError(validationMessage);
      toast({
        title: 'Revise os campos antes de confirmar.',
        description: validationMessage,
        variant: 'destructive',
      });
      return;
    }

    setActionInFlight('maintenance');

    try {
      const priorityLabel = maintenancePriorityOptions.find((opt) => opt.value === maintenancePriority)?.label;
      const impactLabel = maintenanceImpact ? 'Sim' : 'Não';
      const trimmedDescription = maintenanceDescription.trim();
      const descriptionBody = trimmedDescription ? `\n\nDescrição: ${trimmedDescription}` : '';

      await createDemand.mutateAsync({
        title: `Manutenção (${maintenanceCategory}) — Quarto ${room.room_number}`,
        description: `Categoria: ${maintenanceCategory}\nPrioridade: ${priorityLabel || 'Média'}\nImpacta operação: ${impactLabel}${descriptionBody}`,
        category: maintenanceCategory || 'Manutenção Geral',
        priority: maintenancePriority,
        status: 'todo',
        impact_operation: maintenanceImpact,
        room_id: room.id,
      });
      setMaintenanceOpen(false);
      setMaintenanceDescription('');
      setMaintenanceCategory('Elétrica');
      setMaintenancePriority('medium');
      setMaintenanceImpact(false);
      setMaintenanceError(null);
    } catch {
      toast({
        title: 'Não foi possível registrar a manutenção. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setActionInFlight(null);
    }
  };

  return (
    <Card
      className={`border shadow-sm ${
        isSelected ? 'border-primary/60 bg-primary/5' : 'border-border/60'
      }`}
      onClick={handleCardClick}
      role={selectionMode ? 'button' : undefined}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {selectionMode && (
              <div className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect?.(room.id)}
                  onClick={(event) => event.stopPropagation()}
                  className="h-5 w-5"
                />
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Quarto</p>
              <h3 className="text-lg font-semibold text-foreground">
                {room.room_number}
                {room.name ? ` • ${room.name}` : ''}
              </h3>
              {room.room_types?.name && (
                <p className="text-xs text-muted-foreground">{room.room_types.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {updatedLabel} · por {safeRoleLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(currentStatus)}>{getStatusLabel(currentStatus)}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Ações"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={handleOpenNotes}
                  disabled={isCardBusy}
                  className="flex items-center justify-between"
                >
                  <span>Adicionar observação</span>
                  {!isNotesSupported && (
                    <span className="text-xs text-muted-foreground">Em breve</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleOpenMaintenance}
                  disabled={isCardBusy || !maintenanceEnabled}
                  className="flex items-center justify-between"
                >
                  <span>Reportar manutenção</span>
                  {!maintenanceEnabled && (
                    <span className="text-xs text-muted-foreground">Em breve</span>
                  )}
                  {maintenanceEnabled && !isMaintenanceSupported && (
                    <span className="text-xs text-muted-foreground">Em breve</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="flex items-center justify-between">
                  <span>Ver detalhes</span>
                  <span className="text-xs text-muted-foreground">Em breve</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Observação</p>
          <p className="text-sm text-foreground line-clamp-2">
            {observation || 'Sem observações no momento.'}
          </p>
        </div>

        {showChecklist && (
          <div className="space-y-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Checklist de limpeza
              </p>
              {checklistComplete && (
                <span className="text-xs font-semibold text-emerald-600">Concluído</span>
              )}
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={checklistState[index]}
                    onCheckedChange={(checked) => {
                      if (isViewer) return;
                      setChecklistState((prev) => {
                        const next = [...prev];
                        next[index] = Boolean(checked);
                        return next;
                      });
                    }}
                    onClick={(event) => event.stopPropagation()}
                    disabled={isViewer}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Funcionalidade em breve.</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Próxima ação</p>
          <Button
            className="h-11 w-full text-sm font-semibold"
            onClick={(event) => {
              event.stopPropagation();
              handlePrimaryAction();
            }}
            disabled={isActionDisabled}
          >
            {isStatusSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando...
              </span>
            ) : (
              primaryAction.label
            )}
          </Button>
          {primaryAction.helper && (
            <p className="text-xs text-muted-foreground">{primaryAction.helper}</p>
          )}
          {auditLogPath && canViewAuditLogRole ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={(event) => {
                event.stopPropagation();
                navigate(auditLogPath);
              }}
            >
              Ver histórico
            </Button>
          ) : canViewAuditLogRole ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              disabled
            >
              Ver histórico · Em breve
            </Button>
          ) : null}
        </div>
      </CardContent>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar observação</DialogTitle>
            <DialogDescription>Registre uma observação curta sobre o quarto.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Ex: Toalhas extras solicitadas"
            className="min-h-[120px]"
          />
          {!isNotesSupported && (
            <p className="text-xs text-muted-foreground">Funcionalidade em breve.</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancelar
            </Button>
            <Button disabled className="min-w-[120px]">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar manutenção</DialogTitle>
            <DialogDescription>
              Informe rapidamente o que precisa de atenção para este quarto.
            </DialogDescription>
          </DialogHeader>
          {isMaintenanceSupported ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={maintenanceCategory} onValueChange={setMaintenanceCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceCategoryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={maintenancePriority}
                  onValueChange={(value) => setMaintenancePriority(value as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenancePriorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Impacta operação?</p>
                  <p className="text-xs text-muted-foreground">Marque se o quarto precisa ser bloqueado.</p>
                </div>
                <Switch checked={maintenanceImpact} onCheckedChange={setMaintenanceImpact} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={maintenanceDescription}
                  onChange={(event) => {
                    setMaintenanceDescription(event.target.value);
                    setMaintenanceError(null);
                  }}
                  placeholder="Detalhe o problema (opcional)"
                  className="min-h-[120px]"
                />
                {maintenanceError && (
                  <p className="text-xs text-destructive">{maintenanceError}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Funcionalidade em breve.
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMaintenanceOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMaintenanceSubmit}
              disabled={!isMaintenanceSupported || isMaintenanceSubmitting}
              className="min-w-[160px] h-11"
            >
              {isMaintenanceSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MobileRoomCard;
