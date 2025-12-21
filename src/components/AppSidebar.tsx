import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Calendar,
  DollarSign,
  LayoutDashboard,
  LogOut,
  LogIn,
  Settings,
  Users,
  BedDouble,
  ListChecks,
  ShieldCheck,
  Bed,
  Tag,
  ConciergeBell,
  CreditCard,
  ListTodo,
  Wallet,
  Globe,
  Monitor,
  Home,
  Briefcase,
  BarChart3,
  User,
  Zap,
  HelpCircle,
  Star,
  ListOrdered,
  Wifi,
  Brush,
  Construction,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import logoIcon from "@/assets/logo-icon.png";

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut, userRole, userPlan, loading: authLoading } = useAuth();
  const { isAdmin, loading: isAdminLoading } = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";

  if (authLoading || isAdminLoading) return null;

  const menuGroups = [
    {
      label: "Operações Diárias",
      icon: Briefcase,
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Front Desk", url: "/front-desk", icon: Monitor },
        { title: "Chegadas", url: "/arrivals", icon: LogIn },
        { title: "Partidas", url: "/departures", icon: LogOut },
        { title: "Quadro de Quartos", url: "/operation/rooms", icon: BedDouble },
        { title: "Governança", url: "/operation/housekeeping", icon: Brush },
        { title: "Manutenção", url: "/operation/demands", icon: Construction },
        { title: "Reservas", url: "/bookings", icon: Calendar },
        { title: "Motor de Reservas", url: "/book", icon: Globe },
        { title: "Gerenciador de Canais", url: "/channel-manager", icon: Globe },
        { title: "Tarefas", url: "/tasks", icon: ListTodo },
      ]
    },
    {
      label: "Gestão de Equipes",
      icon: Users,
      items: [
        { title: "Plantões (Shifts)", url: "/ops/shifts", icon: CalendarClock },
        { title: "Meus Plantões", url: "/me/shifts", icon: Calendar },
        { title: "Colaboradores", url: "/ops/staff", icon: Users },
      ]
    },
    {
      label: "Célula de Reservas",
      icon: TrendingUp,
      items: [
        { title: "Funil (Pipeline)", url: "/reservations/pipeline", icon: TrendingUp },
      ]
    },
    {
      label: "Gestão de Propriedades",
      icon: Home,
      items: [
        { title: "Propriedades", url: "/properties", icon: Building2 },
        { title: "Tipos de Acomodação", url: "/room-types", icon: BedDouble },
        { title: "Quartos", url: "/rooms", icon: Bed },
        { title: "Comodidades", url: "/amenities", icon: ListChecks },
        { title: "Serviços", url: "/services", icon: ConciergeBell },
      ]
    },
    {
      label: "Financeiro & Hóspedes",
      icon: BarChart3,
      items: [
        { title: "Financeiro", url: "/financial", icon: DollarSign },
        { title: "Despesas", url: "/expenses", icon: Wallet },
        { title: "Regras de Precificação", url: "/pricing-rules", icon: Tag },
        { title: "Hóspedes", url: "/guests", icon: Users },
      ]
    },
    {
      label: "Configurações",
      icon: Settings,
      items: [
        { title: "Minha Conta", url: "/settings", icon: User },
        { title: "Configurações do Site", url: "/website-settings", icon: Globe },
        { title: "Painel Admin", url: "/admin-panel", icon: ShieldCheck, roles: ['admin'] },
        { title: "Gerenciar Planos", url: "/admin/pricing-plans", icon: CreditCard, roles: ['admin'] },
        { title: "Gerenciar Funcionalidades", url: "/admin/features", icon: Zap, roles: ['admin'] },
        { title: "Gerenciar FAQ", url: "/admin/faqs", icon: HelpCircle, roles: ['admin'] },
        { title: "Gerenciar Depoimentos", url: "/admin/testimonials", icon: Star, roles: ['admin'] },
        { title: "Gerenciar Passos", url: "/admin/how-it-works", icon: ListOrdered, roles: ['admin'] },
        { title: "Gerenciar Integrações", url: "/admin/integrations", icon: Wifi, roles: ['admin'] },
      ]
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard" className="flex items-center gap-3">
                <img src={logoIcon} alt="Logo" className="h-6 w-6 object-contain" />
                {!isCollapsed && <span className="font-bold text-lg leading-none">HostConnect</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group, gIndex) => {
          // Filter items by role if specified
          const filteredItems = group.items.filter(item =>
            !item.roles || (userRole && item.roles.includes(userRole))
          );

          if (filteredItems.length === 0) return null;

          const GroupIcon = group.icon;

          return (
            <SidebarGroup key={gIndex}>
              {!isCollapsed && (
                <SidebarGroupLabel className="flex items-center gap-2 px-2">
                  <GroupIcon className="h-3.5 w-3.5 opacity-70" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{group.label}</span>
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={isCollapsed ? item.title : undefined}>
                          <Link to={item.url} className="flex items-center gap-3">
                            <ItemIcon className="h-4 w-4" />
                            {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto bg-sidebar-accent/5">
        <div className="flex flex-col gap-4">
          {!isCollapsed && (
            <div className="flex flex-col gap-1 px-2">
              <span className="text-xs font-bold truncate text-foreground/80">{user?.user_metadata?.full_name || user?.email}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{userRole}</span>
                <span className="text-[9px] bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded font-bold uppercase">{userPlan}</span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size={isCollapsed ? "icon" : "sm"}
            onClick={signOut}
            className="w-full justify-start text-destructive hover:bg-destructive/10 border-none shadow-none bg-transparent h-9"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2 text-xs font-bold uppercase tracking-wide">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;