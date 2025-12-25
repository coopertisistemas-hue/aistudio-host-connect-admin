
import { useSupport } from '@/hooks/useSupport';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const { useIsStaff } = useSupport();
    const { data: isStaff, isLoading } = useIsStaff();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isStaff) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
                    <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h1>
                    <p className="text-slate-600 mb-6">
                        Você não tem permissão para acessar esta área administrativa.
                    </p>
                    <Button onClick={() => navigate('/support')} variant="outline">
                        Voltar para Suporte
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;
