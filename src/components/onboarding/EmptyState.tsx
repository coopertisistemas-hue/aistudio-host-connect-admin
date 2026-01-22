import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Home } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState = ({
    icon: Icon = Home,
    title,
    description,
    primaryAction,
    secondaryAction,
}: EmptyStateProps) => {
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
                <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {isViewer ? 'Solicite ao administrador para configurar' : description}
            </p>
            {!isViewer && (primaryAction || secondaryAction) && (
                <div className="flex gap-2">
                    {primaryAction && (
                        <Button onClick={primaryAction.onClick}>
                            {primaryAction.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="outline" onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

// Specific empty states for common scenarios
export const NoPropertyEmptyState = () => {
    const navigate = useNavigate();
    return (
        <EmptyState
            icon={Building2}
            title="Nenhuma propriedade configurada"
            description="Crie sua primeira propriedade para começar"
            primaryAction={{
                label: 'Configurar agora',
                onClick: () => navigate('/setup'),
            }}
        />
    );
};

export const NoRoomsEmptyState = () => {
    const navigate = useNavigate();
    return (
        <EmptyState
            icon={Home}
            title="Nenhum quarto cadastrado"
            description="Adicione quartos para começar a receber reservas"
            primaryAction={{
                label: 'Criar quartos',
                onClick: () => navigate('/setup?step=3'),
            }}
        />
    );
};
