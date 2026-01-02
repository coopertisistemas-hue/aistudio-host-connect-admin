import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Building2,
  Calendar,
  CreditCard,
  BarChart3,
  Smartphone,
  Bot,
  Globe,
  Users,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  HelpCircle,
  Star,
  Wifi,
  Lock,
  Sparkles,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import StatsSection from "@/components/landing/StatsSection";
import WhyChooseUsSection from "@/components/landing/WhyChooseUsSection";
import PricingSection from "@/components/landing/PricingSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import FAQSection from "@/components/landing/FAQSection";
import CtaSection from "@/components/landing/CtaSection";
import { Helmet } from 'react-helmet-async';
import PublicSupportForm from "@/components/landing/PublicSupportForm";
import FounderBanner from "@/components/landing/FounderBanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquarePlus } from "lucide-react";

const Landing = () => {
  // Static defaults for public LP - no auth hooks
  const siteName = "HostConnect";
  const siteDescription = "Plataforma completa de gestão hoteleira para propriedades de todos os tamanhos. Dashboard avançado, motor de reservas, pagamentos online e muito mais.";
  const siteFaviconUrl = "/favicon.png";
  const siteLogoUrl = "/host-connect-logo-transp.png"; // NEW Transparent Logo

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{siteName} - Sistema de Gestão Hoteleira</title>
        <meta name="description" content={siteDescription} />
        <link rel="canonical" href="https://hostconnect.vercel.app/" />
        <link rel="icon" type="image/png" href={siteFaviconUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content={`${siteName} - Sistema de Gestão Hoteleira`} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hostconnect.vercel.app/" />
        {siteLogoUrl && <meta property="og:image" content={siteLogoUrl} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${siteName} - Sistema de Gestão Hoteleira`} />
        <meta name="twitter:description" content={siteDescription} />
        {siteLogoUrl && <meta name="twitter:image" content={siteLogoUrl} />}

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "name": siteName,
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web, iOS, Android",
                "description": siteDescription,
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "BRL"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.9",
                  "ratingCount": "150"
                }
              },
              {
                "@type": "Organization",
                "name": siteName,
                "url": "https://hostconnect.vercel.app",
                "logo": "https://hostconnect.vercel.app/host-connect-logo-transp.png",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+55-51-98685-9236",
                  "contactType": "customer service",
                  "areaServed": "BR",
                  "availableLanguage": "Portuguese"
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <FounderBanner />
      <Header />

      <HeroSection />

      <StatsSection />

      <FeaturesSection />

      <WhyChooseUsSection />

      <PricingSection />

      <HowItWorksSection />

      <TestimonialsSection />

      <IntegrationsSection />



      <section className="py-20 bg-slate-50" id="support">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Suporte
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Precisa de ajuda ou encontrou um erro?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Estamos sempre melhorando. Se você encontrou algum problema ou tem uma ideia incrível, nos avise!
          </p>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <MessageSquarePlus className="h-5 w-5" />
                Fale Conosco / Relatar Erro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <div className="py-4">
                <PublicSupportForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <CtaSection />

      <Footer />
    </div>
  );
};

export default Landing;