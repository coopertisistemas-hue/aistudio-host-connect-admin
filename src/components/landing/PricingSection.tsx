import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/pricing/PricingCards";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  // Plans data is now handled by PricingCards -> plansData.ts


  /* 
   * Removing Auth/Loading Dependency:
   * Replaced dynamic loading check with direct rendering of static content.
   */

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Planos
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Escolha o plano
            <span className="bg-gradient-hero bg-clip-text text-transparent"> ideal para você</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comece grátis ou acelere com o Founder Program.
          </p>
        </div>

        {/* Grid de 4 Colunas para os Planos */}
        <PricingCards
          renderAction={(plan) => (
            <Link to="/auth" className="block w-full">
              <Button
                variant={plan.highlight ? "hero" : "outline"}
                className="w-full"
                size="sm"
              >
                {plan.cta}
              </Button>
            </Link>
          )}
        />

        {/* Notas de Rodapé */}
        <div className="max-w-4xl mx-auto text-center space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-8">
          <p>• <strong>Premium:</strong> Limite de até 100 acomodações gerenciadas. Para volumes maiores, consulte o plano Enterprise.</p>
          <p>• <strong>Inteligência Artificial:</strong> Funciona no modelo BYO Key (Bring Your Own Key). Você utiliza sua própria chave OpenAI ou Gemini. </p>
          <p>• As chaves de API são armazenadas de forma segura e criptografada em nosso back-end e nunca são expostas no front-end.</p>
          <p>• <strong>E-commerce:</strong> Funcionalidade de loja virtual integrada disponível exclusivamente no plano Premium e Founder.</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;