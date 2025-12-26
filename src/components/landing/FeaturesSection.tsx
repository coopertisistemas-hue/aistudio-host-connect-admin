import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";


const FeaturesSection = () => {
  // Static features for public LP
  const features = [
    {
      id: '1',
      title: 'Motor de Reservas',
      description: 'Aceite reservas diretas no seu site sem comissões.',
      icon: 'Calendar',
      active: true,
      display_order: 1
    },
    {
      id: '2',
      title: 'Gestão de Canais',
      description: 'Sincronize Airbnb, Booking.com e outros em tempo real.',
      icon: 'Globe',
      active: true,
      display_order: 2
    },
    {
      id: '3',
      title: 'Controle Financeiro',
      description: 'Acompanhe receitas, despesas e relatórios automáticos.',
      icon: 'BarChart3',
      active: true,
      display_order: 3
    },
    {
      id: '4',
      title: 'Gestão de Hóspedes',
      description: 'CRM completo com histórico e preferências dos clientes.',
      icon: 'Users',
      active: true,
      display_order: 4
    },
    {
      id: '5',
      title: 'Automação de Tarefas',
      description: 'Automatize emails, limpeza e manutenção.',
      icon: 'Zap',
      active: true,
      display_order: 5
    },
    {
      id: '6',
      title: 'Website Builder',
      description: 'Nós geramos seu site 100% funcional, moderno e otimizado para SEO e campanhas.',
      icon: 'Smartphone',
      active: true,
      display_order: 6
    }
  ];

  /* 
   * Removing Auth/Loading Dependency:
   * Replaced dynamic loading check with direct rendering of static content.
   */

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Funcionalidades
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Tudo que você precisa para
            <span className="bg-gradient-hero bg-clip-text text-transparent"> gerir seu negócio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais para automatizar e otimizar toda sua operação de hospedagem.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon ? (LucideIcons as any)[feature.icon] : LucideIcons.HelpCircle;
            return (
              <Card key={feature.id} className="group border-border hover:shadow-medium hover:border-primary/50 transition-all duration-300 bg-gradient-card cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;