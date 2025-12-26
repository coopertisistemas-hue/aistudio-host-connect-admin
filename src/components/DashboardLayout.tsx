import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import TrialBanner from "@/components/TrialBanner"; // Import TrialBanner
import AppSidebar from "@/components/AppSidebar"; // Importando o AppSidebar
import NotificationBell from "@/components/NotificationBell"; // Importando NotificationBell

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar /> {/* Usando o componente AppSidebar */}
        <div className="flex-1 flex flex-col">
          <TrialBanner /> {/* Trial Banner at the top */}
          <header className="h-14 border-b border-border flex items-center px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1 flex justify-end items-center gap-4">
              <NotificationBell /> {/* Adicionando o sino de notificações */}
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