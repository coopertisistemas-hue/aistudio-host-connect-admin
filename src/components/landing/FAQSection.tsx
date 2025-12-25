import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Loader2 } from "lucide-react";


// Static FAQs for public LP
const faqs = [
  {
    id: '1',
    question: 'Preciso instalar algum software?',
    answer: 'Não. O HostConnect é 100% online e funciona diretamente no navegador do seu computador ou celular.'
  },
  {
    id: '2',
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim! Nossos planos não possuem fidelidade. Você pode cancelar sua assinatura quando quiser sem multas.'
  },
  {
    id: '3',
    question: 'Como funciona o suporte?',
    answer: 'Oferecemos suporte via chat e e-mail em horário comercial. Planos Enterprise contam com gerente de conta dedicado.'
  },
  {
    id: '4',
    question: 'É seguro inserir meus dados?',
    answer: 'Utilizamos criptografia de ponta a ponta e seguimos todas as normas da LGPD para garantir a segurança dos seus dados.'
  },
  {
    id: '5',
    question: 'Integra com quais plataformas?',
    answer: 'Integramos com Airbnb, Booking.com, Expedia, VRBO e muitas outras através do nosso Channel Manager.'
  }
];

const isLoading = false;

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