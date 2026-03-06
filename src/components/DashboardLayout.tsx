import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import TrialBanner from "@/components/TrialBanner"; // Import TrialBanner
import AppSidebar from "@/components/AppSidebar"; // Importando o AppSidebar
import NotificationBell from "@/components/NotificationBell"; // Importando NotificationBell
import TenantSelector from "@/components/TenantSelector";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isSuperAdmin } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar /> {/* Usando o componente AppSidebar */}
        <div className="flex-1 flex flex-col">
          <TrialBanner /> {/* Trial Banner at the top */}
          <header className="h-14 border-b border-border flex items-center px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="min-w-0 overflow-hidden">
                {!isSuperAdmin && <TenantSelector mode="property_only" />}
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell /> {/* Adicionando o sino de notificacoes */}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
