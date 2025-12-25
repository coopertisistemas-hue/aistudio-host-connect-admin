import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Star } from "lucide-react";
import { useEntitlements, PlanType } from "@/hooks/useEntitlements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Plans = () => {
    const { plan: currentPlan, founderExpiresAt, isFounder } = useEntitlements();

    // Define static plans (same as LP but with internal context)
    const plans = [
        {
            id: 'basic', // Matches 'basic' in DB/useEntitlements vs 'start' in LP. LP says 'start', DB says 'basic'. useEntitlements maps 'basic' (Start).
            name: 'Start',
            description: 'Para quem está começando.',
            price: 'Grátis',
            period: '',
            features: [
                'Até 2 acomodações',
                'Motor de Reservas Básico',
                'Calendário Unificado',
                'Taxa de 3% por reserva',
                'Suporte por email'
            ],
            highlight: false,
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'Para anfitriões profissionais.',
            price: 'R$ 49',
            period: '/mês',
            features: [
                'Até 10 acomodações',
                'Channel Manager Completo',
                'Gestão Financeira',
                'Taxa de 1% por reserva',
                'Suporte via Chat'
            ],
            highlight: false,
        },
        {
            id: 'premium',
            name: 'Premium',
            description: 'E-commerce e gestão completa.',
            price: 'R$ 199',
            period: '/mês',
            features: [
                'Até 100 acomodações',
                'E-commerce Integrado',
                'Integração Google Meu Negócio',
                'Site Bônus Personalizado',
                'Concierge IA (BYO Key)',
                'Taxa Zero'
            ],
            highlight: false,
        },
        {
            id: 'founder',
            name: 'Founder Program',
            description: 'Oferta exclusiva de lançamento.',
            price: 'R$ 100',
            period: '/mês (12x)',
            features: [
                'Tudo do plano Premium',
                'Desconto vitalício garantido',
                'Onboarding Dedicado',
                'Acesso antecipado a features',
                'Grupo exclusivo de Founders',
                'Vagas Limitadas: 50'
            ],
            highlight: true,
        }
    ];

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

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan) => {
                        const isCurrent = currentPlan === plan.id || (currentPlan === 'free' && plan.id === 'basic') || (currentPlan === 'basic' && plan.id === 'basic'); // Handle 'free' mapping/fallback if needed, but strict 'basic' match preferred. Check useEntitlements mappings.
                        // useEntitlements: free, basic, pro, premium, founder. 
                        // LP plans: start (basic), pro, premium, founder.
                        // If user is 'free', it might match nothing or 'basic' if we consider it same tier visually?
                        // Let's assume 'free' users see 'Start' as distinct or same? 
                        // In hooks: basic = Start. free = Free (1 accommodation).
                        // So if user is 'free', they are BELOW 'basic' (Start - 2 acc).
                        // So no 'current' badge on Start if they are Free? Or maybe Start is the free tier?
                        // Re-reading PricingSection: Start says "Começar Grátis", Price "Grátis".
                        // Implementation detail: 'free' (1 acc) vs 'basic' (2 accs). 
                        // Let's assume 'free' is the default for no plan, and 'basic' is explicitly 'Start'.
                        // Actually, let's look at PricingSection again: id: 'start'.
                        // useEntitlements maps 'basic' : 2. 'free': 1.
                        // I will match strictly.

                        const isCurrentPlan = currentPlan === plan.id || (currentPlan === 'basic' && plan.id === 'basic');

                        return (
                            <Card
                                key={plan.id}
                                className={`relative flex flex-col justify-between border-2 transition-all duration-300 ${isCurrentPlan
                                        ? "border-green-500 shadow-lg bg-green-50/10"
                                        : plan.highlight
                                            ? "border-primary shadow-large bg-gradient-to-b from-primary/5 to-transparent"
                                            : "border-border hover:border-primary/30"
                                    }`}
                            >
                                {plan.highlight && !isCurrentPlan && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                                        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-medium px-4 py-1 text-sm">
                                            ⭐ Founder 50
                                        </Badge>
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                                        <Badge className="bg-green-600 text-white shadow-medium px-4 py-1 text-sm hover:bg-green-700">
                                            Seu Plano Atual
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
                                    <div className="pt-4">
                                        <span className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">{plan.price}</span>
                                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <ul className="space-y-3 mb-6 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                                                <span className="text-xs font-medium leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrentPlan ? (
                                        <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" disabled>
                                            Plano Ativo
                                        </Button>
                                    ) : (
                                        <Button
                                            variant={plan.highlight ? "hero" : "outline"}
                                            className="w-full"
                                            onClick={() => handleContactSales(plan.name)}
                                        >
                                            {plan.id === 'basic' ? 'Downgrade / Mudar' : 'Falar com Consultor'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Plans;
