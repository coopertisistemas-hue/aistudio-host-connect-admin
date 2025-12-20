import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Shield, Zap, TrendingUp, Headset, DollarSign } from "lucide-react"; // Added Headset and DollarSign

const WhyChooseUsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <Badge variant="outline" className="mb-4">
            <Zap className="mr-2 h-3 w-3" />
            Por que escolher o HostConnect
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Mais do que um sistema,
            <span className="bg-gradient-hero bg-clip-text text-transparent"> um parceiro de crescimento</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-border hover:shadow-medium transition-all duration-300 text-center group animate-scale-in">
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Rápido e Fácil</CardTitle>
              <CardDescription>
                Configure sua conta em minutos e comece a gerenciar suas reservas imediatamente.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-medium transition-all duration-300 text-center group animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-success/10 group-hover:bg-success/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-xl">100% Seguro</CardTitle>
              <CardDescription>
                Seus dados e os de seus hóspedes protegidos com criptografia de nível empresarial.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-medium transition-all duration-300 text-center group animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Smartphone className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">Acesse de Qualquer Lugar</CardTitle>
              <CardDescription>
                Plataforma 100% web responsiva. Gerencie seu hotel do celular, tablet ou computador.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-medium transition-all duration-300 text-center group animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Aumente sua Receita</CardTitle>
              <CardDescription>
                Otimize preços, reduza no-shows e maximize sua taxa de ocupação.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-medium transition-all duration-300 text-center group animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-success/10 group-hover:bg-success/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Headset className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-xl">Suporte Dedicado</CardTitle>
              <CardDescription>
                Conte com nossa equipe especializada para te ajudar em cada passo da sua jornada.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:shadow-medium transition-all duration-300 text-center group animate-scale-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">Custo-Benefício</CardTitle>
              <CardDescription>
                Planos flexíveis com comissões justas, pensados para o seu crescimento.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;