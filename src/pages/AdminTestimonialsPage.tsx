import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Star, Edit, Trash2, Eye, EyeOff, User } from "lucide-react";
import { useTestimonials, Testimonial, TestimonialInput } from "@/hooks/useTestimonials";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import TestimonialDialog from "@/components/admin/TestimonialDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const AdminTestimonialsPage = () => {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const navigate = useNavigate();
  
  const { testimonials, isLoading, createTestimonial, updateTestimonial, deleteTestimonial } = useTestimonials();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, authLoading, navigate]);

  const filteredTestimonials = testimonials.filter((testimonial) =>
    testimonial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTestimonial = () => {
    setSelectedTestimonial(null);
    setDialogOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TestimonialInput) => {
    if (selectedTestimonial) {
      await updateTestimonial.mutateAsync({ id: selectedTestimonial.id, testimonial: data });
    } else {
      await createTestimonial.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setTestimonialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (testimonialToDelete) {
      await deleteTestimonial.mutateAsync(testimonialToDelete);
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    }
  };

  if (authLoading || !isAdmin) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Depoimentos</h1>
            <p className="text-muted-foreground mt-1">
              Configure os depoimentos exibidos na seção "Testimonials" da Landing Page.
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateTestimonial}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Depoimento
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar depoimento por nome ou conteúdo..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Testimonials List */}
        {isLoading ? (
          <DataTableSkeleton variant="table" columns={5} />
        ) : filteredTestimonials.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhum depoimento encontrado" : "Nenhum depoimento cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Cadastre depoimentos para a Landing Page."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateTestimonial}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Depoimento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Conteúdo (Preview)</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Avaliação</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Visível</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestimonials.map((testimonial) => (
                      <tr key={testimonial.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {testimonial.name}
                          {testimonial.role && <span className="block text-xs text-muted-foreground">{testimonial.role}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">{testimonial.content}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            {[...Array(testimonial.rating || 5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-accent fill-accent" />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {testimonial.is_visible ? (
                            <Badge variant="default" className="bg-success hover:bg-success/80 flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Sim
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <EyeOff className="h-3 w-3" /> Não
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTestimonial(testimonial)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(testimonial.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Testimonial Dialog */}
      <TestimonialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        testimonial={selectedTestimonial}
        onSubmit={handleSubmit}
        isLoading={createTestimonial.isPending || updateTestimonial.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este depoimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminTestimonialsPage;