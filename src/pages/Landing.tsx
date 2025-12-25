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

const Landing = () => {
  // Static defaults for public LP - no auth hooks
  const siteName = "HostConnect";
  const siteDescription = "Plataforma completa de gestão hoteleira para propriedades de todos os tamanhos. Dashboard avançado, motor de reservas, pagamentos online e muito mais.";
  const siteFaviconUrl = "/favicon.png";
  const siteLogoUrl = "https://lovable.dev/opengraph-image-p98pqg.png"; // Fallback for OG image

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{siteName} - Sistema de Gestão Hoteleira</title>
        <meta name="description" content={siteDescription} />
        <link rel="icon" type="image/png" href={siteFaviconUrl} />
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={`${siteName} - Sistema de Gestão Hoteleira`} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        {siteLogoUrl && <meta property="og:image" content={siteLogoUrl} />}
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${siteName} - Sistema de Gestão Hoteleira`} />
        <meta name="twitter:description" content={siteDescription} />
        {siteLogoUrl && <meta name="twitter:image" content={siteLogoUrl} />}
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
        <div className="container mx-auto px-4">
          <PublicSupportForm />
        </div>
      </section>

      <CtaSection />

      <Footer />
    </div>
  );
};

export default Landing;