import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PricingCards } from "@/components/pricing/PricingCards";

const Plans = () => {
    const { plan: currentPlan, founderExpiresAt, isFounder, maxAccommodations } = useEntitlements();

    // Mapping 'start' in data to 'basic' if needed, OR 'basic' in db to 'basic' in data. 
    // In plansData we used 'basic'.
    // Entitlements returns: free, basic, pro, premium, founder.
    // If user is 'free', effective plan is 'basic' (Start) for upgrade purposes, but current is Free.
    // We will mark 'basic' as current if user is basic OR free (since Start is the entry level).

    // Logic: 
    // If plan == 'free', highlight 'basic' as "Seu Plano Atual" (Start).
    // If plan == 'basic', highlight 'basic'.
    // If plan == 'pro', highlight 'pro'.

    const effectivePlanId = currentPlan === 'free' ? 'basic' : currentPlan;

    const handleContactSales = (planName: string) => {
        const text = `Olá, gostaria de saber mais sobre o plano ${planName} no HostConnect.`;
        window.open(`https://wa.me/5548999999999?text=${encodeURIComponent(text)}`, "_blank");
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Meus Planos</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie sua assinatura e desbloqueie novos recursos.
                    </p>
                </div>

                {/* Founder Status Banner */}
                {isFounder && founderExpiresAt && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-full text-primary-foreground">
                                <Star className="h-5 w-5 fill-current" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-primary">Status Founder Ativo</h3>
                                <p className="text-sm text-muted-foreground">
                                    Seu acesso especial expira em {format(new Date(founderExpiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Accommodation Limit Banner */}
                <div className="text-center bg-muted/30 p-2 rounded-full inline-block mx-auto w-full mb-8">
                    <p className="text-sm text-muted-foreground">
                        Limite atual de acomodações: <strong className="text-foreground">{maxAccommodations}</strong>
                    </p>
                </div>

                <PricingCards
                    currentPlanId={effectivePlanId}
                    renderAction={(plan, isCurrent) => {
                        if (isCurrent) {
                            return (
                                <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" disabled>
                                    Plano Ativo
                                </Button>
                            );
                        }

                        return (
                            <Button
                                variant={plan.highlight ? "hero" : "outline"}
                                className="w-full"
                                onClick={() => handleContactSales(plan.name)}
                            >
                                {plan.id === 'basic' ? 'Downgrade' : 'Falar com Consultor'}
                            </Button>
                        );
                    }}
                />
            </div>
        </DashboardLayout>
    );
};

export default Plans;
