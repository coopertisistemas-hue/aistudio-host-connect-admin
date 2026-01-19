import { ReactNode } from 'react';
import { usePermissions, ModuleKey, PermissionAction } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
    module: ModuleKey;
    action?: PermissionAction;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Component to guard content based on permissions
 * 
 * @param module - Module key to check
 * @param action - Action to check ('read' or 'write'), defaults to 'read'
 * @param children - Content to render if permission is granted
 * @param fallback - Optional custom fallback component
 * 
 * @example
 * <PermissionGuard module="financial" action="write">
 *   <Button>Editar Financeiro</Button>
 * </PermissionGuard>
 */
export const PermissionGuard = ({
    module,
    action = 'read',
    children,
    fallback,
}: PermissionGuardProps) => {
    const { canAccess, isLoading } = usePermissions();

    if (isLoading) {
        return null; // Or a skeleton loader
    }

    if (!canAccess(module, action)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <Card className="border-destructive/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                        Você não tem permissão para {action === 'write' ? 'editar' : 'visualizar'} este conteúdo.
                        Entre em contato com o administrador da organização.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
};
