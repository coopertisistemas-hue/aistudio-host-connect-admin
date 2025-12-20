import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Loader2 } from "lucide-react";
import { useFaqs } from "@/hooks/useFaqs";

const FAQSection = () => {
  const { faqs, isLoading } = useFaqs();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <Badge variant="outline" className="mb-4">
            <HelpCircle className="mr-2 h-3 w-3" />
            Perguntas Frequentes
          </Badge>
          <h2 className="text-4xl font-bold">
            Dúvidas Comuns
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas rápidas para as perguntas mais frequentes sobre o HostConnect.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto animate-fade-in">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Carregando perguntas...</p>
            </div>
          ) : faqs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma pergunta frequente cadastrada.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;