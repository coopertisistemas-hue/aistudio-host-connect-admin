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
  ChevronDown,
  Hash,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useEntitlements } from "@/hooks/useEntitlements";
import logoIcon from "@/assets/logo-icon.png";

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut, userRole, userPlan, loading: authLoading } = useAuth();
  const { isAdmin, loading: isAdminLoading } = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";

  if (authLoading || isAdminLoading) return null;

  // Entitlement Gates
  const { canAccess } = useEntitlements();

  const menuGroups = [
    {
      label: "Operacional",
      icon: Briefcase,
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Front Desk", url: "/front-desk", icon: Monitor },
        { title: "Quadro de Quartos", url: "/operation/rooms", icon: BedDouble },
        { title: "Governança", url: "/operation/housekeeping", icon: Brush },
        { title: "Manutenção", url: "/operation/demands", icon: Construction },
        { title: "Tarefas", url: "/tasks", icon: ListTodo },
      ]
    },
    {
      label: "Vendas & Reservas",
      icon: TrendingUp,
      items: [
        { title: "Funil (Pipeline)", url: "/reservations/pipeline", icon: TrendingUp },
        { title: "Reservas", url: "/bookings", icon: Calendar },
        { title: "Chegadas", url: "/arrivals", icon: LogIn },
        { title: "Partidas", url: "/departures", icon: LogOut },
        { title: "Motor de Reservas", url: "/book", icon: Globe },
      ]
    },
    {
      label: "Marketing & Canais",
      icon: Zap,
      items: [
        { title: "Inbox Unificada", url: "/marketing/inbox", icon: Hash },
        { title: "Overview", url: "/marketing/overview", icon: BarChart3 },
        { title: "Conectores", url: "/marketing/connectors", icon: Globe, gated: !canAccess('otas') },
        { title: "Google Performance", url: "/marketing/google", icon: Monitor, gated: !canAccess('gmb') },
      ]
    },
    {
      label: "Configuração de Unidades",
      icon: Home,
      items: [
        { title: "Propriedades", url: "/properties", icon: Building2 },
        { title: "Tipos de Acomodação", url: "/room-types", icon: BedDouble },
        { title: "Quartos", url: "/rooms", icon: Bed },
        { title: "Comodidades", url: "/amenities", icon: ListChecks },
        { title: "Serviços", url: "/services", icon: ConciergeBell },
        { title: "Gerenciador de Canais", url: "/channel-manager", icon: Globe, gated: !canAccess('otas') },
      ]
    },
    {
      label: "Financeiro",
      icon: BarChart3,
      items: [
        { title: "Financeiro", url: "/financial", icon: DollarSign },
        { title: "Despesas", url: "/expenses", icon: Wallet },
        { title: "Regras de Precificação", url: "/pricing-rules", icon: Tag },
        { title: "Hóspedes", url: "/guests", icon: Users },
      ]
    },
    {
      label: "Gestão & Admin",
      icon: Settings,
      items: [
        { title: "Plantões (Shifts)", url: "/ops/shifts", icon: CalendarClock },
        { title: "Meus Plantões", url: "/me/shifts", icon: Calendar },
        { title: "Colaboradores", url: "/ops/staff", icon: Users },
        { title: "Configurações", url: "/settings", icon: User },
        { title: "Website", url: "/website-settings", icon: Globe, gated: !canAccess('site_bonus') },
        { title: "Painel Admin", url: "/admin-panel", icon: ShieldCheck, roles: ['admin'] },
        { title: "Planos", url: "/admin/pricing-plans", icon: CreditCard, roles: ['admin'] },
        { title: "Funcionalidades", url: "/admin/features", icon: Zap, roles: ['admin'] },
        { title: "FAQ", url: "/admin/faqs", icon: HelpCircle, roles: ['admin'] },
        { title: "Depoimentos", url: "/admin/testimonials", icon: Star, roles: ['admin'] },
        { title: "Integrações", url: "/admin/integrations", icon: Wifi, roles: ['admin'] },
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
                <img src="/host-connect-logo.png" alt="Host Connect Logo" className="h-8 w-auto object-contain" />
                {!isCollapsed && <span className="font-bold text-lg leading-none">Host Connect</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group, gIndex) => {
          const filteredItems = group.items.filter(item =>
            (!item.roles || (userRole && item.roles.includes(userRole))) &&
            !item.gated
          );

          if (filteredItems.length === 0) return null;

          const GroupIcon = group.icon;
          const isSomeItemActive = filteredItems.some(item => isActive(item.url));

          return (
            <Collapsible
              key={gIndex}
              asChild
              defaultOpen={isSomeItemActive || gIndex === 0}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    <div className="flex w-full items-center gap-2">
                      <GroupIcon className="h-3.5 w-3.5 opacity-70" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-left">
                            {group.label}
                          </span>
                          <ChevronDown className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </div>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
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
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
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