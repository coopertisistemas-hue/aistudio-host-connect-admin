import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import DataTableSkeleton from "@/components/DataTableSkeleton";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  plan: string;
  created_at: string;
}

const AdminPanel = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<Profile>>>({});

  const handleFieldChange = (id: string, field: keyof Profile, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  // ... inside render: profile.role becomes (pendingChanges[profile.id]?.role || profile.role)

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      navigate('/dashboard');
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [userRole, authLoading, navigate, toast]);

  const { data: users, isLoading: usersLoading } = useQuery<Profile[]>({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'admin', // Only fetch if user is admin
  });

  const updateUserRoleAndPlan = useMutation({
    mutationFn: async ({ id, role, plan, accommodation_limit, founder_started_at, founder_expires_at }: { id: string; role?: string; plan?: string, accommodation_limit?: number, founder_started_at?: string | null, founder_expires_at?: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role, plan, accommodation_limit, founder_started_at, founder_expires_at })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast({
        title: "Sucesso!",
        description: "Perfil do usuário atualizado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil: " + error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.plan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, papéis e planos da plataforma
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário por nome, email, papel ou plano..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários da Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <DataTableSkeleton variant="table" columns={5} />
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Select
                            value={profile.role}
                            onValueChange={(value) =>
                              updateUserRoleAndPlan.mutate({ id: profile.id, role: value })
                            }
                            disabled={updateUserRoleAndPlan.isPending || profile.id === user?.id} // Prevent changing own role
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.plan}
                            onValueChange={(value) =>
                              updateUserRoleAndPlan.mutate({ id: profile.id, plan: value })
                            }
                            disabled={updateUserRoleAndPlan.isPending}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Grátis</SelectItem>
                              <SelectItem value="basic">Start (Básico)</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="founder">Founder Program</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updateUserRoleAndPlan.isPending || profile.id === user?.id}
                            onClick={() => {
                              // Save Logic specific for Plans
                              let updateData: any = {
                                role: profile.role,
                                plan: profile.plan
                              };

                              if (profile.plan === 'founder') {
                                const now = new Date();
                                const nextYear = new Date();
                                nextYear.setFullYear(now.getFullYear() + 1);

                                updateData.accommodation_limit = 100;
                                updateData.founder_started_at = now.toISOString();
                                updateData.founder_expires_at = nextYear.toISOString();
                              } else if (profile.plan === 'premium') {
                                updateData.accommodation_limit = 100;
                                updateData.founder_started_at = null;
                                updateData.founder_expires_at = null;
                              } else if (profile.plan === 'pro') {
                                updateData.accommodation_limit = 10;
                                updateData.founder_started_at = null;
                                updateData.founder_expires_at = null;
                              } else if (profile.plan === 'basic') { // Start
                                updateData.accommodation_limit = 2;
                                updateData.founder_started_at = null;
                                updateData.founder_expires_at = null;
                              } else { // Free
                                updateData.accommodation_limit = 1;
                                updateData.founder_started_at = null;
                                updateData.founder_expires_at = null;
                              }

                              updateUserRoleAndPlan.mutate({ id: profile.id, ...updateData });
                            }}
                          >
                            Salvar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;