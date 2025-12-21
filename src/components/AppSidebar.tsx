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
  Home, // Novo ícone para grupo de Propriedades
  Briefcase, // Novo ícone para grupo de Operações
  BarChart3, // Novo ícone para grupo Financeiro
  User, // Novo ícone para Perfil
  Zap, // Ícone para Funcionalidades
  HelpCircle, // Ícone para FAQ
  Star, // Ícone para Depoimentos
  ListOrdered, // Ícone para Como Funciona
  Wifi, // Ícone para Integrações
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import logoIcon from "@/assets/logo-icon.png";

const menuGroups = [
  {
    label: "Operações Diárias",
    icon: Briefcase,
    roles: ['user', 'admin'],
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Front Desk", url: "/front-desk", icon: Monitor },
      { title: "Chegadas", url: "/arrivals", icon: LogIn },
      { title: "Partidas", url: "/departures", icon: LogOut },
      { title: "Reservas", url: "/bookings", icon: Calendar },
      { title: "Gerenciador de Canais", url: "/channel-manager", icon: Globe }, // NEW
      { title: "Tarefas", url: "/tasks", icon: ListTodo },
    ]
  },
  {
    label: "Gestão de Propriedades",
    icon: Home,
    roles: ['user', 'admin'],
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
    roles: ['user', 'admin'],
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
    roles: ['user', 'admin'],
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

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut, userRole, userPlan } = useAuth();
  const { isAdmin, loading: isAdminLoading } = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";

  if (isAdminLoading) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Link to="/dashboard" className="flex items-center gap-3 py-2">
              <img src={logoIcon} alt="HostConnect" className="h-8 w-8 object-contain" />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold bg-gradient-hero bg-clip-text text-transparent">
                    HostConnect
                  </span>
                </div>
              )}
            </Link>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {menuGroups.map((group, groupIndex) => {
              // Filter items based on user role
              const visibleItems = group.items.filter(item =>
                !item.roles || (userRole && item.roles.includes(userRole)) || (group.roles.includes(userRole || 'user'))
              );

              if (visibleItems.length === 0) return null;

              return (
                <SidebarMenu key={groupIndex} className="mt-4">
                  {!isCollapsed && (
                    <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground/70 mb-2 flex items-center gap-2">
                      <group.icon className="h-4 w-4" />
                      {group.label}
                    </SidebarGroupLabel>
                  )}
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className={`p-4 border-t border-sidebar-border ${isCollapsed ? "px-2" : ""}`}>
              {!isCollapsed && (
                <div className="mb-3 p-2 bg-sidebar-accent rounded-md">
                  <p className="text-sm font-bold text-sidebar-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    Papel: <span className="capitalize font-medium text-primary">{userRole}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Plano: <span className="capitalize font-medium text-accent">{userPlan}</span>
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size={isCollapsed ? "icon" : "sm"}
                onClick={signOut}
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Sair</span>}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;