import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, TrendingUp } from "lucide-react";
import { usePublicWebsiteSettings } from "@/hooks/usePublicWebsiteSettings";
import { useProperties } from "@/hooks/useProperties";
import * as analytics from "@/lib/analytics";

const CtaSection = () => {
  const { properties } = useProperties();
  const defaultPropertyId = properties.length > 0 ? properties[0].id : undefined;
  const { data: websiteSettings } = usePublicWebsiteSettings(defaultPropertyId || '');

  const ctaTitle = websiteSettings?.cta_title || "Pronto para transformar sua gestão hoteleira?";
  const ctaDescription = websiteSettings?.cta_description || "Junte-se a centenas de hotéis que já confiam no HostConnect.";

  return (
    <section id="contact" className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              {ctaTitle.split('transformar sua gestão hoteleira?')[0]}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {" "}
                {ctaTitle.split('transformar sua gestão hoteleira?')[1] || "transformar sua gestão hoteleira?"}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {ctaDescription}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" onClick={() => analytics.event({ action: 'click_cta', category: 'engagement', label: 'adquirir_plano_footer' })}>
              <Button variant="hero" size="lg" className="group">
                Adquirir Plano Agora
                <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => analytics.event({ action: 'click_cta', category: 'engagement', label: 'falar_vendas' })}>
              Falar com Vendas
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Garantia de 30 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Suporte em português</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;