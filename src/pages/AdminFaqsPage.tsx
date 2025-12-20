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
import { Plus, Search, HelpCircle, Edit, Trash2 } from "lucide-react";
import { useFaqs, Faq, FaqInput } from "@/hooks/useFaqs";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import FaqDialog from "@/components/admin/FaqDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";

const AdminFaqsPage = () => {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const navigate = useNavigate();
  
  const { faqs, isLoading, createFaq, updateFaq, deleteFaq } = useFaqs();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, authLoading, navigate]);

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFaq = () => {
    setSelectedFaq(null);
    setDialogOpen(true);
  };

  const handleEditFaq = (faq: Faq) => {
    setSelectedFaq(faq);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: FaqInput) => {
    if (selectedFaq) {
      await updateFaq.mutateAsync({ id: selectedFaq.id, faq: data });
    } else {
      await createFaq.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (faqToDelete) {
      await deleteFaq.mutateAsync(faqToDelete);
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
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
            <h1 className="text-3xl font-bold">Gerenciar Perguntas Frequentes (FAQ)</h1>
            <p className="text-muted-foreground mt-1">
              Configure as perguntas e respostas exibidas na seção FAQ da Landing Page.
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateFaq}>
            <Plus className="mr-2 h-4 w-4" />
            Nova FAQ
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pergunta ou resposta..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* FAQ List */}
        {isLoading ? (
          <DataTableSkeleton variant="table" columns={3} />
        ) : filteredFaqs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhuma FAQ encontrada" : "Nenhuma FAQ cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Cadastre as perguntas frequentes para a Landing Page."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateFaq}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira FAQ
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
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Pergunta</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Resposta (Preview)</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Ordem</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaqs.map((faq) => (
                      <tr key={faq.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium max-w-xs">{faq.question}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">{faq.answer}</td>
                        <td className="px-4 py-3 text-sm">{faq.display_order}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditFaq(faq)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(faq.id)}>
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

      {/* FAQ Dialog */}
      <FaqDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        faq={selectedFaq}
        onSubmit={handleSubmit}
        isLoading={createFaq.isPending || updateFaq.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pergunta frequente? Esta ação não pode ser desfeita.
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

export default AdminFaqsPage;