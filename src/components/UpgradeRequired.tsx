import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Lock, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradeRequiredProps {
    title?: string;
    description?: string;
    features?: string[];
    minPlan?: string;
}

const UpgradeRequired = ({
    title = "Funcionalidade Premium",
    description = "Faça um upgrade no seu plano para desbloquear este recurso exclusivo e potenciar sua gestão.",
    features = [],
    minPlan = "Premium"
}: UpgradeRequiredProps) => {

    const handleRequestUpgrade = () => {
        // Open WhatsApp or Support Form
        window.open("https://wa.me/5548999999999?text=Olá, gostaria de fazer upgrade para o plano " + minPlan, "_blank");
    };

    return (
        <div className="h-full min-h-[60vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-t-4 border-t-primary shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary animate-pulse">
                        <Lock className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <p className="text-muted-foreground mt-2">{description}</p>
                </CardHeader>
                <CardContent className="pt-6">
                    {features.length > 0 && (
                        <div className="bg-muted/30 p-4 rounded-lg border mb-6">
                            <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-foreground/80">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                O que você ganha com o plano {minPlan}:
                            </h4>
                            <ul className="space-y-2">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-0">
                    <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:to-primary"
                        size="lg"
                        onClick={handleRequestUpgrade}
                    >
                        Solicitar Upgrade para {minPlan}
                    </Button>
                    <Link to="/admin/pricing-plans" className="w-full">
                        <Button variant="outline" className="w-full">
                            Ver Tabela de Planos <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default UpgradeRequired;
