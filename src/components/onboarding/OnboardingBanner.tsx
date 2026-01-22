import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useProperties } from '@/hooks/useProperties';
import { useRooms } from '@/hooks/useRooms';
import { useUpdateOnboarding } from '@/hooks/useOnboardingState';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OnboardingBanner = () => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const { onboarding, isLoading } = useOnboardingState();
    const { properties } = useProperties();
    const { mutate: updateOnboarding } = useUpdateOnboarding();

    // Get first property to check rooms
    const firstProperty = properties?.[0];
    const { data: rooms } = useRooms(firstProperty?.id);

    // Don't show if loading
    if (isLoading) return null;

    // Don't show if completed or dismissed
    if (onboarding?.completed_at || onboarding?.dismissed_at) return null;

    // Don't show if has properties AND rooms
    if (properties && properties.length > 0 && rooms && rooms.length > 0) return null;

    const handleStart = () => {
        navigate('/setup');
    };

    const handleDismiss = () => {
        updateOnboarding({ dismissed_at: new Date().toISOString() });
    };

    const isViewer = userRole === 'viewer';

    return (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Configure o HostConnect em poucos minutos
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        {isViewer
                            ? 'Solicite ao administrador para configurar o sistema'
                            : 'Complete a configuração inicial para começar a usar todas as funcionalidades'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isViewer && (
                        <>
                            <Button
                                size="sm"
                                onClick={handleStart}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Configurar agora
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="text-blue-600"
                            >
                                Agora não
                            </Button>
                        </>
                    )}
                    {isViewer && (
                        <Button size="sm" variant="ghost" onClick={handleDismiss}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
};
