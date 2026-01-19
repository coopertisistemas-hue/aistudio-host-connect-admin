import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/hooks/useOrg';
import { usePermissions, ModuleKey } from '@/hooks/usePermissions';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Shield, User, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface OrgMember {
    id: string;
    user_id: string;
    role: string;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
}

interface MemberPermission {
    id: string;
    org_id: string;
    user_id: string;
    module_key: ModuleKey;
    can_read: boolean;
    can_write: boolean;
}

const MODULES: { key: ModuleKey; label: string; description: string }[] = [
    { key: 'financial', label: 'Financeiro', description: 'Receitas, despesas e relatórios financeiros' },
    { key: 'bookings', label: 'Reservas', description: 'Gestão de reservas e check-in/out' },
    { key: 'guests', label: 'Hóspedes', description: 'Dados de hóspedes e CRM' },
    { key: 'properties', label: 'Propriedades', description: 'Configuração de propriedades e quartos' },
    { key: 'inventory', label: 'Inventário', description: 'Estoque e ponto de venda' },
    { key: 'team', label: 'Equipe', description: 'Gestão de membros e escalas' },
    { key: 'reports', label: 'Relatórios', description: 'Relatórios e análises' },
    { key: 'settings', label: 'Configurações', description: 'Configurações do sistema' },
];

const PermissionsPage = () => {
    const { currentOrgId } = useOrg();
    const { isOwnerOrAdmin } = usePermissions();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    // Fetch org members
    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: ['org-members', currentOrgId],
        queryFn: async () => {
            if (!currentOrgId) return [];

            const { data, error } = await supabase
                .from('org_members')
                .select(`
          id,
          user_id,
          role,
          profiles:user_id (
            full_name,
            email
          )
        `)
                .eq('org_id', currentOrgId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('[PermissionsPage] Error fetching members:', error);
                throw error;
            }

            return data as unknown as OrgMember[];
        },
        enabled: !!currentOrgId && isOwnerOrAdmin,
    });

    // Fetch permissions for selected user
    const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
        queryKey: ['user-permissions', selectedUserId, currentOrgId],
        queryFn: async () => {
            if (!selectedUserId || !currentOrgId) return [];

            const { data, error } = await supabase
                .from('member_permissions')
                .select('*')
                .eq('user_id', selectedUserId)
                .eq('org_id', currentOrgId);

            if (error) {
                console.error('[PermissionsPage] Error fetching permissions:', error);
                return [];
            }

            return data as MemberPermission[];
        },
        enabled: !!selectedUserId && !!currentOrgId,
    });

    // Update permission mutation
    const updatePermission = useMutation({
        mutationFn: async ({
            userId,
            moduleKey,
            canRead,
            canWrite,
        }: {
            userId: string;
            moduleKey: ModuleKey;
            canRead: boolean;
            canWrite: boolean;
        }) => {
            if (!currentOrgId) throw new Error('No organization selected');

            const existingPermission = permissions.find(p => p.module_key === moduleKey);

            if (existingPermission) {
                // Update existing permission
                const { error } = await supabase
                    .from('member_permissions')
                    .update({ can_read: canRead, can_write: canWrite })
                    .eq('id', existingPermission.id);

                if (error) throw error;
            } else {
                // Create new permission
                const { error } = await supabase
                    .from('member_permissions')
                    .insert({
                        org_id: currentOrgId,
                        user_id: userId,
                        module_key: moduleKey,
                        can_read: canRead,
                        can_write: canWrite,
                    });

                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-permissions', selectedUserId, currentOrgId] });
            queryClient.invalidateQueries({ queryKey: ['member-permissions'] });
            toast({
                title: 'Permissão atualizada',
                description: 'As permissões foram atualizadas com sucesso.',
            });
        },
        onError: (error) => {
            console.error('[PermissionsPage] Error updating permission:', error);
            toast({
                title: 'Erro ao atualizar permissão',
                description: 'Não foi possível atualizar a permissão. Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const selectedMember = members.find(m => m.user_id === selectedUserId);
    const isViewerRole = selectedMember?.role === 'viewer';
    const isOwnerOrAdminRole = selectedMember?.role === 'owner' || selectedMember?.role === 'admin';

    const getPermissionForModule = (moduleKey: ModuleKey) => {
        return permissions.find(p => p.module_key === moduleKey);
    };

    const handleToggleRead = (moduleKey: ModuleKey, currentValue: boolean) => {
        if (isOwnerOrAdminRole || isViewerRole) return; // Cannot modify owner/admin/viewer permissions

        updatePermission.mutate({
            userId: selectedUserId,
            moduleKey,
            canRead: !currentValue,
            canWrite: getPermissionForModule(moduleKey)?.can_write || false,
        });
    };

    const handleToggleWrite = (moduleKey: ModuleKey, currentValue: boolean) => {
        if (isOwnerOrAdminRole || isViewerRole) return; // Cannot modify owner/admin/viewer permissions

        const permission = getPermissionForModule(moduleKey);
        const canRead = permission?.can_read || false;

        // If enabling write, automatically enable read
        const newCanRead = !currentValue ? true : canRead;

        updatePermission.mutate({
            userId: selectedUserId,
            moduleKey,
            canRead: newCanRead,
            canWrite: !currentValue,
        });
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
                            Apenas proprietários e administradores podem gerenciar permissões.
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
                    <h1 className="text-3xl font-bold">Permissões</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as permissões de acesso dos membros da equipe
                    </p>
                </div>

                {/* Member Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Selecionar Membro</CardTitle>
                        <CardDescription>
                            Escolha um membro da equipe para gerenciar suas permissões
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {membersLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Carregando membros...</span>
                            </div>
                        ) : (
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger className="w-full max-w-md">
                                    <SelectValue placeholder="Selecione um membro" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.user_id}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>{member.profiles?.full_name || member.profiles?.email || 'Sem nome'}</span>
                                                <Badge variant="outline" className="ml-2">
                                                    {member.role}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </CardContent>
                </Card>

                {/* Permissions Table */}
                {selectedUserId && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissões de Módulos</CardTitle>
                            <CardDescription>
                                {isOwnerOrAdminRole && (
                                    <div className="flex items-center gap-2 text-amber-600 mt-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Proprietários e administradores têm acesso total a todos os módulos</span>
                                    </div>
                                )}
                                {isViewerRole && (
                                    <div className="flex items-center gap-2 text-blue-600 mt-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Visualizadores têm acesso somente leitura a todos os módulos</span>
                                    </div>
                                )}
                                {!isOwnerOrAdminRole && !isViewerRole && (
                                    <span>Configure as permissões de leitura e escrita para cada módulo</span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {permissionsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {MODULES.map((module) => {
                                        const permission = getPermissionForModule(module.key);
                                        const canRead = isOwnerOrAdminRole || isViewerRole || permission?.can_read || false;
                                        const canWrite = isOwnerOrAdminRole || (permission?.can_write && !isViewerRole) || false;

                                        return (
                                            <div
                                                key={module.key}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{module.label}</h4>
                                                    <p className="text-sm text-muted-foreground">{module.description}</p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Leitura</span>
                                                        <Switch
                                                            checked={canRead}
                                                            onCheckedChange={() => handleToggleRead(module.key, canRead)}
                                                            disabled={isOwnerOrAdminRole || isViewerRole || updatePermission.isPending}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Escrita</span>
                                                        <Switch
                                                            checked={canWrite}
                                                            onCheckedChange={() => handleToggleWrite(module.key, canWrite)}
                                                            disabled={isOwnerOrAdminRole || isViewerRole || updatePermission.isPending}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Sobre Permissões</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            <strong>Proprietário e Administrador:</strong> Acesso total a todos os módulos (não configurável).
                        </p>
                        <p>
                            <strong>Visualizador:</strong> Acesso somente leitura a todos os módulos (não configurável).
                        </p>
                        <p>
                            <strong>Membro:</strong> Permissões personalizáveis por módulo.
                        </p>
                        <p>
                            <strong>Leitura:</strong> Permite visualizar dados do módulo.
                        </p>
                        <p>
                            <strong>Escrita:</strong> Permite criar, editar e deletar dados do módulo (inclui automaticamente leitura).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PermissionsPage;
