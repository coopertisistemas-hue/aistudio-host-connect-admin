import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, Plus, Loader2, UserX, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HostConnectStaff {
    id: string;
    user_id: string;
    created_at: string;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
}

const StaffManagementAdminPage = () => {
    const { userRole } = useAuth();
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newStaffEmail, setNewStaffEmail] = useState('');

    // Only allow admin/owner to access this page
    const isAdmin = userRole === 'admin' || userRole === 'owner';

    // Fetch HostConnect staff
    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['hostconnect-staff'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('hostconnect_staff')
                .select(`
          id,
          user_id,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[StaffManagementAdminPage] Error fetching staff:', error);
                throw error;
            }

            return data as unknown as HostConnectStaff[];
        },
        enabled: isAdmin,
    });

    // Add staff member mutation
    const addStaffMutation = useMutation({
        mutationFn: async (email: string) => {
            // First, find the user by email
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !userData) {
                throw new Error('Usuário não encontrado com este email');
            }

            // Check if already staff
            const { data: existingStaff } = await supabase
                .from('hostconnect_staff')
                .select('id')
                .eq('user_id', userData.id)
                .single();

            if (existingStaff) {
                throw new Error('Este usuário já é membro da equipe HostConnect');
            }

            // Add to hostconnect_staff
            const { error: insertError } = await supabase
                .from('hostconnect_staff')
                .insert({
                    user_id: userData.id,
                });

            if (insertError) throw insertError;

            return userData.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hostconnect-staff'] });
            toast({
                title: 'Membro Adicionado',
                description: 'O usuário foi adicionado à equipe HostConnect com sucesso.',
            });
            setIsAddDialogOpen(false);
            setNewStaffEmail('');
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao Adicionar Membro',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Remove staff member mutation
    const removeStaffMutation = useMutation({
        mutationFn: async (staffId: string) => {
            const { error } = await supabase
                .from('hostconnect_staff')
                .delete()
                .eq('id', staffId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hostconnect-staff'] });
            toast({
                title: 'Membro Removido',
                description: 'O usuário foi removido da equipe HostConnect.',
            });
        },
        onError: (error) => {
            console.error('[StaffManagementAdminPage] Error removing staff:', error);
            toast({
                title: 'Erro ao Remover Membro',
                description: 'Não foi possível remover o membro. Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const handleAddStaff = () => {
        if (!newStaffEmail.trim()) {
            toast({
                title: 'Email Obrigatório',
                description: 'Por favor, insira o email do usuário.',
                variant: 'destructive',
            });
            return;
        }

        addStaffMutation.mutate(newStaffEmail.trim());
    };

    const handleRemoveStaff = (staffId: string, userName: string) => {
        if (confirm(`Tem certeza que deseja remover ${userName} da equipe HostConnect?`)) {
            removeStaffMutation.mutate(staffId);
        }
    };

    // Access control
    if (!isAdmin) {
        return (
            <DashboardLayout>
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Shield className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Apenas administradores do sistema podem gerenciar a equipe HostConnect.
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Equipe HostConnect</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie os membros da equipe de suporte com acesso cross-organizacional
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar Membro
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Membro à Equipe HostConnect</DialogTitle>
                                <DialogDescription>
                                    Insira o email do usuário que deseja adicionar à equipe de suporte.
                                    Este usuário terá acesso a todas as organizações.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email do Usuário
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@exemplo.com"
                                        value={newStaffEmail}
                                        onChange={(e) => setNewStaffEmail(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddStaff();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <strong>Atenção:</strong> Membros da equipe HostConnect têm acesso
                                        total a todas as organizações para fins de suporte.
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddDialogOpen(false);
                                        setNewStaffEmail('');
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAddStaff}
                                    disabled={addStaffMutation.isPending}
                                    className="gap-2"
                                >
                                    {addStaffMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Adicionar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Staff Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Membros da Equipe</CardTitle>
                        <CardDescription>
                            Lista de todos os membros com acesso de suporte ao sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Shield className="h-12 w-12 mb-4" />
                                <p>Nenhum membro da equipe cadastrado</p>
                                <p className="text-sm mt-2">Clique em "Adicionar Membro" para começar</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Adicionado em</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staff.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                            {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || '?'}
                                                        </div>
                                                        {member.profiles?.full_name || 'Sem nome'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{member.profiles?.email || '-'}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {format(new Date(member.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRemoveStaff(
                                                                member.id,
                                                                member.profiles?.full_name || member.profiles?.email || 'este usuário'
                                                            )
                                                        }
                                                        disabled={removeStaffMutation.isPending}
                                                        className="gap-2 text-destructive hover:text-destructive"
                                                    >
                                                        <UserX className="h-4 w-4" />
                                                        Remover
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Sobre a Equipe HostConnect</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            A equipe HostConnect é composta por membros de suporte que têm acesso especial ao sistema:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Acesso a todas as organizações (cross-org)</li>
                            <li>Visualização de tickets e ideias de todas as organizações</li>
                            <li>Capacidade de visualizar logs de auditoria globais</li>
                            <li>Permissões especiais para fins de suporte técnico</li>
                        </ul>
                        <p className="mt-4">
                            <strong>Importante:</strong> Adicione apenas usuários confiáveis à equipe HostConnect,
                            pois eles terão acesso privilegiado ao sistema.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default StaffManagementAdminPage;
