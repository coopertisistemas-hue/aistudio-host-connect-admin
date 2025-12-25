import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";


const PricingSection = () => {
  // Static pricing plans for public LP
  const plans = [
    {
      id: '1',
      name: 'Starter',
      description: 'Ideal para proprietários individuais e anfitriões.',
      price: 0,
      period: '/mês', // Fixed logic below will expect this or we adapt
      commission: 0,
      features: ['Até 2 propriedades', 'Gestão de reservas básica', 'Calendário unificado', 'Suporte por email'],
      is_popular: false
    },
    {
      id: '2',
      name: 'Profissional',
      description: 'Para gerentes de propriedades em crescimento.',
      price: 150,
      period: '/mês',
      commission: 0,
      features: ['Até 10 propriedades', 'Motor de reservas avançado', 'Relatórios financeiros', 'Suporte prioritário', 'Múltiplos usuários'],
      is_popular: true
    },
    {
      id: '3',
      name: 'Enterprise',
      description: 'Solução completa para grandes operações.',
      price: 450,
      period: '/mês',
      commission: 0,
      features: ['Propriedades ilimitadas', 'API dedicada', 'Gerente de conta exclusivo', 'Personalização White-label', 'Treinamento da equipe'],
      is_popular: false
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
            Planos flexíveis que crescem com seu negócio. Todos incluem 30 dias de garantia de devolução do valor.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative border-2 transition-all duration-300 hover:scale-105 ${plan.is_popular
                ? "border-primary shadow-large bg-gradient-to-b from-primary/5 to-transparent"
                : "border-border hover:border-primary/30 hover:shadow-medium"
                }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-medium px-4 py-1">
                    ⭐ Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="pt-6">
                  <span className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">R$ {plan.price.toFixed(0)}</span>
                  <span className="text-muted-foreground text-lg">{plan.period}</span>
                  <p className="text-sm text-muted-foreground mt-1">Comissão sobre reservas: {plan.commission.toFixed(0)}%</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button
                    variant={plan.is_popular ? "hero" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    Adquirir Plano
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;