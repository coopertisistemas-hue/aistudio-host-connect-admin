import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";


const PricingSection = () => {
  // Planos atualizados conforme regras do Founder Program
  const plans = [
    {
      id: 'start',
      name: 'Start',
      description: 'Para quem está começando.',
      price: 'Grátis',
      period: '',
      features: [
        'Até 2 acomodações',
        'Motor de Reservas Básico',
        'Calendário Unificado',
        'Taxa de 3% por reserva',
        'Suporte por email'
      ],
      highlight: false,
      cta: 'Começar Grátis'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Para anfitriões profissionais.',
      price: 'R$ 49',
      period: '/mês',
      features: [
        'Até 10 acomodações',
        'Channel Manager Completo',
        'Gestão Financeira',
        'Taxa de 1% por reserva',
        'Suporte via Chat'
      ],
      highlight: false,
      cta: 'Assinar Pro'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'E-commerce e gestão completa.',
      price: 'R$ 199',
      period: '/mês',
      features: [
        'Até 100 acomodações',
        'E-commerce Integrado',
        'Integração Google Meu Negócio',
        'Site Bônus Personalizado',
        'Concierge IA (BYO Key)',
        'Taxa Zero'
      ],
      highlight: false,
      cta: 'Falar com Consultor'
    },
    {
      id: 'founder',
      name: 'Founder Program',
      description: 'Oferta exclusiva de lançamento.',
      price: 'R$ 100',
      period: '/mês (12x)',
      features: [
        'Tudo do plano Premium',
        'Desconto vitalício garantido',
        'Onboarding Dedicado',
        'Acesso antecipado a features',
        'Grupo exclusivo de Founders',
        'Vagas Limitadas: 50'
      ],
      highlight: true,
      cta: 'Garantir Vaga Founder'
    }
  ];

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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between border-2 transition-all duration-300 hover:scale-105 ${plan.highlight
                  ? "border-primary shadow-large bg-gradient-to-b from-primary/5 to-transparent"
                  : "border-border hover:border-primary/30 hover:shadow-medium"
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-medium px-4 py-1 text-sm">
                    ⭐ Founder 50
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-1" />
                      <span className="text-xs font-medium leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block mt-auto">
                  <Button
                    variant={plan.highlight ? "hero" : "outline"}
                    className="w-full"
                    size="sm"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

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