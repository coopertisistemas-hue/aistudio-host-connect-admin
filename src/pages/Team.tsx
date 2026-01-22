
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrg } from '@/hooks/useOrg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Copy, Users, UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getRoleDisplayName } from '@/lib/constants/roles';

export default function TeamPage() {
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();
    const { userRole, loading: authLoading } = useAuth();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('manager'); // Changed default to manager as per new roles
    const queryClient = useQueryClient();

    const isAdmin = userRole === 'owner' || userRole === 'admin';

    // Fetch Members
    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ['team_members', currentOrgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('org_members')
                .select(`
          *,
          profiles:user_id (full_name, email)
        `)
                .eq('org_id', currentOrgId!);

            if (error) throw error;
            return data;
        },
        enabled: !!currentOrgId
    });

    // Fetch Invites
    const { data: invites, isLoading: isInvitesLoading } = useQuery({
        queryKey: ['org_invites', currentOrgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('org_invites')
                .select('*')
                .eq('status', 'pending')
                .eq('org_id', currentOrgId!);

            if (error) throw error;
            return data;
        },
        enabled: !!currentOrgId && isAdmin
    });

    // Invite Mutation
    const inviteMutation = useMutation({
        mutationFn: async () => {
            if (!currentOrgId) throw new Error("No Org ID");
            const { data, error } = await supabase
                .from('org_invites')
                .insert({
                    org_id: currentOrgId,
                    email: inviteEmail,
                    role: inviteRole
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast({
                title: "Convite Criado",
                description: `Link gerado. Token: ${data.token}`,
            });
            setInviteEmail('');
            queryClient.invalidateQueries({ queryKey: ['org_invites'] });
        },
        onError: (err) => {
            toast({
                title: "Erro",
                description: err.message,
                variant: "destructive"
            });
        }
    });

    const handleCopyInvite = (token: string) => {
        // In real app, this would be a full URL like https://app.com/join?token=...
        // For now, valid for the prompt requirement "admin envia link"
        const link = `${window.location.origin}/join?token=${token}`;
        navigator.clipboard.writeText(link);
        toast({ title: "Link copiado!", description: "Envie para o usuário." });
    };

    if (isOrgLoading || authLoading) return <div>Carregando...</div>;

    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestão de Equipe</h1>
                        <p className="text-muted-foreground">Gerencie membros e permissões da sua organização.</p>
                    </div>
                </div>

                {/* Invite Section */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Convidar Membro</CardTitle>
                            <CardDescription>Envie um link de convite para adicionar novos membros.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    placeholder="exemplo@email.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="w-[180px] space-y-2">
                                <label className="text-sm font-medium">Função</label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Dono</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="staff_frontdesk">Recepção</SelectItem>
                                        <SelectItem value="staff_housekeeping">Limpeza</SelectItem>
                                        <SelectItem value="viewer">Visualizador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
                                Gerar Convite
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Members List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Membros Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Função</TableHead>
                                    <TableHead>Entrou em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members?.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">
                                            {/* @ts-ignore joined data */}
                                            {member.profiles?.full_name || 'Usuário'}
                                        </TableCell>
                                        <TableCell>
                                            {/* @ts-ignore joined data */}
                                            {member.profiles?.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase">{getRoleDisplayName(member.role)}</Badge>
                                        </TableCell>
                                        <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            {/* Placeholder for Edit/Permissions */}
                                            <Button variant="ghost" size="sm">Editar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pending Invites */}
                {isAdmin && invites && invites.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Convites Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead>Token/Link</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invites.map((invite) => (
                                        <TableRow key={invite.id}>
                                            <TableCell>{invite.email}</TableCell>
                                            <TableCell>{invite.role}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                                                {invite.token}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleCopyInvite(invite.token)}>
                                                    <Copy className="h-4 w-4 mr-2" /> Copiar Link
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
