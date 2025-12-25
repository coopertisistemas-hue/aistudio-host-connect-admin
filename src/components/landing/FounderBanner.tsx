
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FounderBanner = () => {
    const scrollToPricing = () => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-3 px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

            <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left z-10 relative">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs font-bold uppercase tracking-wider">Founder Program</span>
                </div>

                <p className="text-sm md:text-base font-medium">
                    <span className="font-bold">50 primeiras vagas:</span> Plano Premium por apenas <span className="font-bold underline decoration-yellow-300 decoration-2 underline-offset-2">R$ 100/mês</span> durante 12 meses.
                </p>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={scrollToPricing}
                    className="group bg-white text-primary hover:bg-slate-100 border-none shadow-lg text-xs md:text-sm font-semibold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                    Ver Planos
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
};

export default FounderBanner;
