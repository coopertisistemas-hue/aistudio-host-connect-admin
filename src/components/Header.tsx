import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";


const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  // Static defaults for public header to avoid auth hooks
  const siteName = "Host Connect";
  const siteLogoUrl = "/host-connect-logo.png";
  const demoUrl = "";
  const settingsLoading = false;

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

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

  const navItems = [
    { label: "Funcionalidades", id: "features" },
    { label: "Planos", id: "pricing" },
    { label: "Como Funciona", id: "how-it-works" },
    { label: "Contato", id: "contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={siteLogoUrl} alt={`${siteName} Logo`} className="h-10 w-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {siteName}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.id);
                }}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            <Link to="/book" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Reservar
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleDemoClick} disabled={settingsLoading}>
              Ver Demonstração
            </Button>
            <Link to="/auth">
              <Button variant="hero" size="sm">
                Adquirir Plano
              </Button>
            </Link>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-8">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                      }}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors text-left"
                    >
                      {item.label}
                    </a>
                  ))}
                  <Link to="/book" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors text-left">
                    Reservar
                  </Link>
                  <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-border">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full" onClick={handleDemoClick} disabled={settingsLoading}>
                      Ver Demonstração
                    </Button>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="hero" size="lg" className="w-full">
                        Adquirir Plano
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;