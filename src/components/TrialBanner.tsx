
import { AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";

const TrialBanner = () => {
    const { isTrial, trialDaysLeft, plan, isTrialExpired } = useEntitlements();

    // Se não estiver em trial (nem ativo nem expirado), não mostra nada
    // exceto se quisermos mostrar algo para 'free' que nunca teve trial (out of scope for now)
    // O hook useEntitlements vai expor isTrial e isTrialExpired

    // Caso 1: Trial Ativo
    if (isTrial && !isTrialExpired) {
        return (
            <div className="bg-indigo-600 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-sm shadow-md animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <Clock className="h-4 w-4 text-indigo-200" />
                    <span>
                        <strong>Trial Premium ativo</strong> — expira em {trialDaysLeft} dias ({new Date(new Date().setDate(new Date().getDate() + trialDaysLeft)).toLocaleDateString('pt-BR')}).
                    </span>
                </div>
                <Link to="/plans">
                    <Button variant="secondary" size="sm" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                        Assinar Agora
                    </Button>
                </Link>
            </div>
        );
    }

    // Caso 2: Trial Expirado
    if (isTrialExpired) {
        return (
            <div className="bg-destructive text-destructive-foreground px-4 py-3 flex flex-col sm:flex-row items-center justify-between shadow-md">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                        Trial expirado. Faça o upgrade para continuar.
                    </span>
                </div>
                <Link to="/plans">
                    <Button variant="default" size="sm" className="bg-white text-destructive hover:bg-gray-100 font-bold">
                        Escolher Plano
                    </Button>
                </Link>
            </div>
        );
    }

    return null;
};

export default TrialBanner;
