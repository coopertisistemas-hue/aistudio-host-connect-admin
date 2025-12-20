import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Zap, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePublicWebsiteSettings } from "@/hooks/usePublicWebsiteSettings";
import { useProperties } from "@/hooks/useProperties";

const HeroSection = () => {
  const { toast } = useToast();
  const { properties } = useProperties();

  const defaultPropertyId = properties.length > 0 ? properties[0].id : undefined;
  const { data: websiteSettings, isLoading: settingsLoading } = usePublicWebsiteSettings(defaultPropertyId || '');

  const siteHeadline = websiteSettings?.site_headline || "Gestão de Propriedades Moderna e Completa";
  const siteDescription = websiteSettings?.site_description || "Sistema completo para gerenciar suas propriedades, reservas, pagamentos e muito mais. Tudo em uma única plataforma intuitiva e poderosa.";
  const demoUrl = websiteSettings?.demo_url || "";

  // Split the headline to apply gradient to the last word/phrase
  const headlineParts = siteHeadline.split(' ');
  const gradientWord = headlineParts.pop() || '';
  const staticHeadline = headlineParts.join(' ');

  const handleDemoClick = () => {
    if (demoUrl) {
      window.open(demoUrl, '_blank');
    } else {
      toast({
        title: "Demonstração em breve!",
        description: "Estamos preparando uma demonstração interativa para você.",
      });
    }
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-1 gap-12 items-center text-center">
          <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
            <Badge variant="secondary" className="w-fit mx-auto">
              <Zap className="h-3 w-3 mr-1" />
              Plataforma SaaS Completa
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              {staticHeadline}{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {gradientWord}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {siteDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="hero" size="lg" className="w-full sm:w-auto group">
                  Adquirir Plano
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={handleDemoClick} disabled={settingsLoading}>
                Ver Demonstração
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 justify-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Garantia de 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">100% seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;