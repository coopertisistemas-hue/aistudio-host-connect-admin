import { Building2, Mail, Phone, MapPin, Send, Instagram, Facebook, Globe } from "lucide-react"; // Added social icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePublicWebsiteSettings } from "@/hooks/usePublicWebsiteSettings";
import { useProperties } from "@/hooks/useProperties";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { properties } = useProperties();

  // Use the first property's ID for public settings, or a default if none
  const defaultPropertyId = properties.length > 0 ? properties[0].id : undefined;
  const { data: websiteSettings, isLoading: settingsLoading } = usePublicWebsiteSettings(defaultPropertyId || '');

  const siteName = websiteSettings?.site_name || "HostConnect";
  const siteLogoUrl = websiteSettings?.site_logo_url || "https://oravqykjpgqoiidqnfja.supabase.co/storage/v1/object/public/website-assets/HostConnect%20Logotipo.png";
  const siteDescription = websiteSettings?.site_description || "Plataforma completa para gestão hoteleira e reservas online.";
  const contactEmail = websiteSettings?.contact_email || "contato@hostconnect.com.br";
  const contactPhone = websiteSettings?.contact_phone || "(49) 99999-9999";
  const socialInstagram = websiteSettings?.social_instagram || "#";
  const socialFacebook = websiteSettings?.social_facebook || "#";
  const socialGoogleBusiness = websiteSettings?.social_google_business || "#";
  const blogUrl = websiteSettings?.blog_url || "#";
  const aboutContent = websiteSettings?.site_about_content ? "/about" : "#";


  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Inscrição realizada!",
        description: "Você receberá nossas novidades em breve.",
      });
      setEmail("");
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">
              Fique por dentro das novidades
            </h3>
            <p className="text-muted-foreground mb-6">
              Receba dicas exclusivas, atualizações e conteúdos sobre gestão hoteleira
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu melhor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" variant="hero" className="group">
                Inscrever
                <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={siteLogoUrl} alt={`${siteName} Logo`} className="h-10 w-10 object-contain" />
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">
                  {siteName}
                </span>
            </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {siteDescription}
            </p>
            <div className="flex gap-3 mt-4">
              {socialInstagram && socialInstagram !== '#' && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialFacebook && socialFacebook !== '#' && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialGoogleBusiness && socialGoogleBusiness !== '#' && (
                <a href={socialGoogleBusiness} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Produto</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Planos
                </a>
              </li>
              <li>
                <a href={blogUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <a href={aboutContent !== '#' ? "/about" : "#"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href={blogUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {contactEmail}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {contactPhone}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Urubici, SC
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 {siteName} - Urubici Connect. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;