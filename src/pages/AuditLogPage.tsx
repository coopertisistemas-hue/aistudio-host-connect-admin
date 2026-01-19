import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/hooks/useOrg';
import { usePermissions } from '@/hooks/usePermissions';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, Loader2, Calendar, User, FileText, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogEntry {
    id: string;
    org_id: string | null;
    user_id: string | null;
    event_type: string;
    entity_type: string | null;
    entity_id: string | null;
    details: Record<string, any> | null;
    created_at: string;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'permission.updated': 'Permissão Atualizada',
    'staff.created': 'Staff Criado',
    'staff.removed': 'Staff Removido',
    'config.updated': 'Configuração Atualizada',
    'org.created': 'Organização Criada',
    'org.updated': 'Organização Atualizada',
    'member.invited': 'Membro Convidado',
    'member.removed': 'Membro Removido',
    'property.created': 'Propriedade Criada',
    'property.updated': 'Propriedade Atualizada',
    'property.deleted': 'Propriedade Deletada',
    'booking.created': 'Reserva Criada',
    'booking.updated': 'Reserva Atualizada',
    'booking.cancelled': 'Reserva Cancelada',
};

const EVENT_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'auth.login': 'default',
    'auth.logout': 'secondary',
    'permission.updated': 'outline',
    'staff.created': 'default',
    'staff.removed': 'destructive',
    'config.updated': 'outline',
    'org.created': 'default',
    'org.updated': 'outline',
    'member.invited': 'default',
    'member.removed': 'destructive',
    'property.created': 'default',
    'property.updated': 'outline',
    'property.deleted': 'destructive',
    'booking.created': 'default',
    'booking.updated': 'outline',
    'booking.cancelled': 'destructive',
};

const AuditLogPage = () => {
    const { currentOrgId } = useOrg();
    const { isOwnerOrAdmin } = usePermissions();
    const [page, setPage] = useState(0);
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const pageSize = 50;

    // Fetch audit logs
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs', currentOrgId, page, eventTypeFilter, entityTypeFilter, searchQuery],
        queryFn: async () => {
            if (!currentOrgId) return [];

            let query = supabase
                .from('audit_log')
                .select(`
          id,
          org_id,
          user_id,
          event_type,
          entity_type,
          entity_id,
          details,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
                .eq('org_id', currentOrgId)
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            // Apply filters
            if (eventTypeFilter !== 'all') {
                query = query.eq('event_type', eventTypeFilter);
            }

            if (entityTypeFilter !== 'all') {
                query = query.eq('entity_type', entityTypeFilter);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[AuditLogPage] Error fetching logs:', error);
                throw error;
            }

            // Client-side search filter (for user names/emails)
            let filteredData = data as unknown as AuditLogEntry[];

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                filteredData = filteredData.filter(log => {
                    const userName = log.profiles?.full_name?.toLowerCase() || '';
                    const userEmail = log.profiles?.email?.toLowerCase() || '';
                    const eventType = log.event_type.toLowerCase();
                    const entityType = log.entity_type?.toLowerCase() || '';

                    return (
                        userName.includes(lowerQuery) ||
                        userEmail.includes(lowerQuery) ||
                        eventType.includes(lowerQuery) ||
                        entityType.includes(lowerQuery)
                    );
                });
            }

            return filteredData;
        },
        enabled: !!currentOrgId && isOwnerOrAdmin,
    });

    // Get unique event types from logs for filter
    const uniqueEventTypes = Array.from(new Set(logs.map(log => log.event_type)));
    const uniqueEntityTypes = Array.from(new Set(logs.map(log => log.entity_type).filter(Boolean)));

    const handleClearFilters = () => {
        setEventTypeFilter('all');
        setEntityTypeFilter('all');
        setSearchQuery('');
        setPage(0);
    };

    const formatDetails = (details: Record<string, any> | null) => {
        if (!details) return '-';

        // Format common detail patterns
        if (details.module_key) {
            return `Módulo: ${details.module_key}`;
        }

        if (details.role) {
            return `Função: ${details.role}`;
        }

        if (details.changes) {
            return `Alterações: ${Object.keys(details.changes).join(', ')}`;
        }

        // Fallback: show first few keys
        const keys = Object.keys(details).slice(0, 3);
        return keys.map(key => `${key}: ${details[key]}`).join(', ');
    };

    // Access control
    if (!isOwnerOrAdmin) {
        return (
            <DashboardLayout>
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Shield className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Apenas proprietários e administradores podem visualizar o log de auditoria.
                        </p>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Log de Auditoria</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize todas as ações importantes realizadas no sistema
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                        <CardDescription>
                            Filtre os eventos por tipo, entidade ou busque por usuário
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Buscar por usuário, evento ou entidade..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(0);
                                    }}
                                    className="w-full"
                                />
                            </div>

                            {/* Event Type Filter */}
                            <Select value={eventTypeFilter} onValueChange={(value) => {
                                setEventTypeFilter(value);
                                setPage(0);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de Evento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Eventos</SelectItem>
                                    {uniqueEventTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {EVENT_TYPE_LABELS[type] || type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Entity Type Filter */}
                            <Select value={entityTypeFilter} onValueChange={(value) => {
                                setEntityTypeFilter(value);
                                setPage(0);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de Entidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Entidades</SelectItem>
                                    {uniqueEntityTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Clear Filters */}
                        {(eventTypeFilter !== 'all' || entityTypeFilter !== 'all' || searchQuery) && (
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Limpar Filtros
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Audit Log Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Eventos do Sistema</CardTitle>
                        <CardDescription>
                            Histórico de ações realizadas na organização (somente leitura)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mb-4" />
                                <p>Nenhum evento encontrado</p>
                                {(eventTypeFilter !== 'all' || entityTypeFilter !== 'all' || searchQuery) && (
                                    <p className="text-sm mt-2">Tente ajustar os filtros</p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[180px]">Data/Hora</TableHead>
                                                <TableHead className="w-[200px]">Usuário</TableHead>
                                                <TableHead className="w-[180px]">Evento</TableHead>
                                                <TableHead className="w-[150px]">Entidade</TableHead>
                                                <TableHead>Detalhes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {log.profiles?.full_name || 'Sistema'}
                                                                </span>
                                                                {log.profiles?.email && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {log.profiles.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={EVENT_TYPE_VARIANTS[log.event_type] || 'default'}>
                                                            {EVENT_TYPE_LABELS[log.event_type] || log.event_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.entity_type ? (
                                                            <span className="text-sm font-medium">{log.entity_type}</span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <span className="text-sm text-muted-foreground line-clamp-2">
                                                            {formatDetails(log.details)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, page * pageSize + logs.length)} eventos
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={logs.length < pageSize}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Sobre o Log de Auditoria</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            O log de auditoria registra todas as ações importantes realizadas no sistema, incluindo:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Login e logout de usuários</li>
                            <li>Alterações de permissões</li>
                            <li>Criação e remoção de membros da equipe</li>
                            <li>Atualizações de configurações críticas</li>
                            <li>Criação, edição e exclusão de recursos importantes</li>
                        </ul>
                        <p className="mt-4">
                            <strong>Nota:</strong> Este log é somente leitura e não pode ser modificado ou deletado.
                            Todos os eventos são armazenados permanentemente para fins de auditoria e conformidade.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AuditLogPage;
