import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, BookOpen } from "lucide-react";

interface AiConfigWarningProps {
    featureName?: string;
    className?: string;
}

export const AiConfigWarning = ({ featureName = "Recursos de IA", className = "" }: AiConfigWarningProps) => {
    return (
        <Alert variant="default" className={`bg-amber-50 border-amber-200 text-amber-900 ${className}`}>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertTitle className="mb-2 font-semibold">Configuração de Segurança (BYO Key)</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
                <p>
                    Para garantir a segurança dos seus dados, as chaves de API ({featureName}) <strong>nunca</strong> são armazenadas no seu navegador ou dispositivo.
                </p>
                <div className="flex items-start gap-2 text-amber-800 bg-amber-100/50 p-2 rounded text-xs">
                    <BookOpen className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        A configuração deve ser realizada exclusivamente via variáveis de ambiente no painel do servidor ou através do suporte técnico.
                        <strong> Não insira chaves de API em campos de formulário nesta página.</strong>
                    </span>
                </div>
            </AlertDescription>
        </Alert>
    );
};
