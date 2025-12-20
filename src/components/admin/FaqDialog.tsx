import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Faq, FaqInput, faqSchema } from "@/hooks/useFaqs";
import { Loader2, HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface FaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq?: Faq | null;
  onSubmit: (data: FaqInput) => void;
  isLoading?: boolean;
}

const FaqDialog = ({ open, onOpenChange, faq, onSubmit, isLoading }: FaqDialogProps) => {
  const form = useForm<FaqInput>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      display_order: 0,
    },
  });

  useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        display_order: faq.display_order || 0,
      });
    } else {
      form.reset();
    }
  }, [faq, open, form]);

  const handleFormSubmit = (data: FaqInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{faq ? "Editar Pergunta Frequente" : "Nova Pergunta Frequente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Pergunta *</Label>
            <Input
              id="question"
              placeholder="Ex: O HostConnect é seguro?"
              {...form.register("question")}
            />
            {form.formState.errors.question && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.question.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Resposta *</Label>
            <Textarea
              id="answer"
              placeholder="A resposta detalhada para a pergunta."
              rows={5}
              {...form.register("answer")}
            />
            {form.formState.errors.answer && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.answer.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Ordem de Exibição</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              {...form.register("display_order", { valueAsNumber: true })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {faq ? "Salvar Alterações" : "Criar FAQ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FaqDialog;