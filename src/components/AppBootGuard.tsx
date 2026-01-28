import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrg } from '@/hooks/useOrg';
import { safeLogger } from '@/lib/logging/safeLogger';
import { Link } from 'react-router-dom';
import FullPageLoading from '@/components/FullPageLoading';
import { endMark, emitAppBoot } from '@/lib/observability/metrics';

const AppBootGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { currentOrgId, isLoading: orgLoading, isSuperAdmin } = useOrg();
  const bootReported = useRef(false);

  useEffect(() => {
    if (bootReported.current) return;
    const durationMs = endMark('app_boot');
    if (durationMs !== null) {
      emitAppBoot(durationMs);
      bootReported.current = true;
    }
  }, []);

  if (authLoading || orgLoading) {
    safeLogger.debug('boot.loading');
    return <FullPageLoading />;
  }

  if (!user) {
    safeLogger.warn('boot.session_missing');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">Sessão expirada, faça login novamente</h1>
          <Button asChild className="w-full">
            <Link to="/auth">Ir para login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentOrgId) {
    safeLogger.warn('boot.org_missing', { isSuperAdmin });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">Selecione uma organização</h1>
          <p className="text-sm text-muted-foreground">
            Para continuar, escolha uma organização ativa.
          </p>
          <Button asChild className="w-full" variant="outline">
            <Link to="/settings">Abrir configurações</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppBootGuard;
