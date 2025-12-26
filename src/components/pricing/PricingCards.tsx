import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { PLANS, Plan } from "./plansData";

interface PricingCardsProps {
    currentPlanId?: string | null;
    renderAction: (plan: Plan, isCurrent: boolean) => React.ReactNode;
}

export const PricingCards = ({ currentPlanId, renderAction }: PricingCardsProps) => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
            {PLANS.map((plan) => {
                // Normalize currentPlanId 'free' / 'basic' / 'start' handling if needed.
                // Assuming stricter matching here, parent controls the ID passed.
                const isCurrent = currentPlanId === plan.id;

                return (
                    <Card
                        key={plan.id}
                        className={`relative flex flex-col justify-between border-2 transition-all duration-300 hover:scale-105 ${isCurrent
                                ? "border-green-500 shadow-lg bg-green-50/10"
                                : plan.highlight
                                    ? "border-primary shadow-large bg-gradient-to-b from-primary/5 to-transparent"
                                    : "border-border hover:border-primary/30 hover:shadow-medium"
                            }`}
                    >
                        {plan.highlight && !isCurrent && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-medium px-4 py-1 text-sm">
                                    ⭐ Founder 50
                                </Badge>
                            </div>
                        )}

                        {isCurrent && (
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
                                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-1 ${isCurrent ? 'text-green-500' : 'text-success'}`} />
                                        <span className="text-xs font-medium leading-relaxed">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                {renderAction(plan, isCurrent)}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
