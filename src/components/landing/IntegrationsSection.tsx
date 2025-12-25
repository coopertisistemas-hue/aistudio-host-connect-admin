import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import {
  Lock,
  Shield,
  Sparkles,
  HelpCircle,
} from "lucide-react";


// Static integrations for public LP to avoid auth hooks
const IntegrationsSection = () => {
  const integrations = [
    { id: '1', name: 'Airbnb', icon: 'Home', description: 'Sincronização de calendários e reservas' },
    { id: '2', name: 'Booking.com', icon: 'Building2', description: 'Gerenciamento centralizado de disponibilidade' },
    { id: '3', name: 'Stripe', icon: 'CreditCard', description: 'Processamento de pagamentos seguro' },
    { id: '4', name: 'WhatsApp', icon: 'Smartphone', description: 'Comunicação automatizada com hóspedes' },
    { id: '5', name: 'Google Calendar', icon: 'Calendar', description: 'Organização de tarefas e eventos' },
    { id: '6', name: 'Expedia', icon: 'Globe', description: 'Alcance global para sua propriedade' },
  ];


  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-2 h-3 w-3" />
            Integrações
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Conecte-se com
            <span className="bg-gradient-hero bg-clip-text text-transparent"> suas ferramentas favoritas</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Integre facilmente com as principais plataformas do mercado
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto mb-12">
          {integrations.map((integration, index) => {
            const IconComponent = integration.icon ? (LucideIcons as any)[integration.icon] : HelpCircle;
            return (
              <Card key={integration.id} className="border-border hover:border-primary/50 hover:shadow-medium transition-all duration-300 group cursor-pointer">
                <CardHeader className="p-6 text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 flex items-center justify-center mb-3 transition-all group-hover:scale-110">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{integration.name}</p>
                  {integration.description && <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>}
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5 text-success" />
            <span className="text-sm">Conexão Segura SSL</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5 text-success" />
            <span className="text-sm">LGPD Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HelpCircle className="h-5 w-5 text-success" />
            <span className="text-sm">API Aberta</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;