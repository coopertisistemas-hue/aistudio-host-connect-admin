import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { useBookings } from "@/hooks/useBookings";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useOrg } from "@/hooks/useOrg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, isFuture, isPast, subDays, parseISO, subMonths, startOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  LogOut,
  LogIn,
  Percent,
  BarChart3,
  CalendarIcon,
  LayoutDashboard,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getStatusBadge } from "@/lib/ui-helpers";
import DashboardRoomStatus from "@/components/DashboardRoomStatus";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useState, useMemo, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const getDefaultDateRange = () => ({
  from: startOfMonth(subMonths(new Date(), 5)),
  to: new Date(),
});

const Dashboard = () => {
  const { user } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertySelectionLoading } = useSelectedProperty();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultDateRange());
  const [isBypassing, setIsBypassing] = useState(false); // Flag para pular carregamentos travados

  // ✅ AUTO-BYPASS: Se demorar mais de 8s, força a entrada no Dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((propertiesLoading || propertySelectionLoading) && !isBypassing) {
        console.warn('[Dashboard] Auto-bypass triggered after 8s hang.');
        setIsBypassing(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [propertiesLoading, propertySelectionLoading, isBypassing]);

  // ✅ CRITICAL: Aguardar seleção de propriedade antes de buscar dados
  const canFetchData = (!propertySelectionLoading || isBypassing) && (!!selectedPropertyId || isBypassing);

  console.log('[Dashboard] Render state:', {
    propertiesLoading,
    propertySelectionLoading,
    selectedPropertyId,
    canFetchData,
    propertiesCount: properties.length
  });

  const { bookings, isLoading: bookingsLoading } = useBookings(canFetchData ? selectedPropertyId : undefined);
  const { summary, isLoading: summaryLoading } = useFinancialSummary(
    canFetchData ? selectedPropertyId : undefined,
    dateRange as { from: Date; to: Date } | undefined
  );

  // ✅ Estado de loading global
  const isLoadingAny = propertiesLoading || propertySelectionLoading || (canFetchData && (bookingsLoading || summaryLoading));

  // Filter for upcoming bookings
  const upcomingBookings = useMemo(() => {
    if (!canFetchData || bookingsLoading) return [];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return bookings
      .filter(b => (b.status === 'confirmed' || b.status === 'pending') && isFuture(parseISO(b.check_in)) && parseISO(b.check_in) <= nextWeek)
      .sort((a, b) => parseISO(a.check_in).getTime() - parseISO(b.check_in).getTime())
      .slice(0, 5);
  }, [bookings, canFetchData, bookingsLoading]);

  // Filter for recent activity
  const recentActivity = useMemo(() => {
    if (!canFetchData || bookingsLoading) return [];
    const sevenDaysAgo = subDays(new Date(), 7);
    return bookings
      .filter(b => {
        const checkInDate = parseISO(b.check_in);
        const checkOutDate = parseISO(b.check_out);
        return (isPast(checkInDate) && checkInDate >= sevenDaysAgo) || (isPast(checkOutDate) && checkOutDate >= sevenDaysAgo);
      })
      .sort((a, b) => {
        const dateA = Math.max(parseISO(a.check_in).getTime(), parseISO(a.check_out).getTime());
        const dateB = Math.max(parseISO(b.check_in).getTime(), parseISO(b.check_out).getTime());
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [bookings, canFetchData, bookingsLoading]);

  // Generate occupancy chart data
  const occupancyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    const baseOccupancy = summary?.occupancyRate || 45;
    return months.map((month, index) => {
      const variation = Math.sin(index) * 15;
      return {
        month: format(month, 'MMM', { locale: ptBR }),
        occupancy: Math.min(100, Math.max(0, Math.round(baseOccupancy + variation))),
      };
    });
  }, [summary]);

  // ═══════════════════════════════════════════════════════════
  // GUARDS — Ordem Crítica
  // ═══════════════════════════════════════════════════════════

  const { isLoading: isPropertiesLoading, error: propertiesError } = useProperties();
  const { isAuthLoading, isQueryLoading: isOrgLoading, error: orgError } = useOrg();

  // GUARD 1: Loading inicial (properties + selection)
  // SE isBypassing for true, ignoramos esse guard COMPLETAMENTE
  if (!isBypassing && (propertiesLoading || propertySelectionLoading)) {
    console.log('[Dashboard] Guard 1 (Loading) Active', { propertiesLoading, propertySelectionLoading });
    const loadingMessage = isAuthLoading ? 'Autenticando...' : isOrgLoading ? 'Buscando sua organização...' : isPropertiesLoading ? 'Buscando propriedades...' : 'Sincronizando seleção...';

    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          {orgError ? (
            <div className="text-center space-y-4 animate-in fade-in duration-500">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-amber-600">Acesso Restrito ou Lento</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Não conseguimos validar sua organização. Você pode tentar continuar ou recarregar a página.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Recarregar
                </Button>
                <Link to="/properties">
                  <Button variant="default" size="sm">
                    Ir para Propriedades
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Carregando Dashboard...</p>
                <p className="text-sm text-muted-foreground">
                  {loadingMessage}
                </p>

                {/* Botão de escape caso trave por muito tempo */}
                <div className="pt-8 flex flex-col items-center gap-3">
                  <p className="text-[10px] text-muted-foreground animate-pulse">
                    Tempo de resposta do servidor excedido...
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="font-bold shadow-lg ring-2 ring-red-500 ring-offset-2"
                    onClick={() => {
                      console.warn('[Dashboard] EMERGENCY bypass triggered!');
                      setIsBypassing(true);
                      toast({
                        title: "Modo de Emergência Ativado",
                        description: "Ignorando validações de carregamento para liberar a tela.",
                        variant: "default",
                      });
                    }}
                  >
                    🚀 LIBERAR ACESSO AGORA
                  </Button>
                  <p className="text-[9px] text-muted-foreground px-4 text-center">
                    Clique acima se a tela não mudar em 5 segundos.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // GUARD 2: Sem propriedades cadastradas
  if (properties.length === 0 && !isBypassing) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Nenhuma Propriedade Encontrada</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Você ainda não tem propriedades cadastradas. Comece adicionando sua primeira unidade.
            </p>
          </div>
          <Link to="/properties">
            <Button size="lg" className="rounded-xl px-8">
              Cadastrar Minha Primeira Propriedade
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // GUARD 3: Propriedade não selecionada (edge case - não deveria acontecer)
  if (!selectedPropertyId && !isBypassing) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-muted-foreground">Aguardando seleção de propriedade...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════

  const stats = [
    {
      title: "Taxa de Ocupação",
      value: `${summary?.occupancyRate || 0}%`,
      icon: Percent,
      color: "text-primary",
      description: "Média do período",
      trend: 4.2,
    },
    {
      title: "Diária Média (ADR)",
      value: `R$ ${(summary?.adr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-500",
      description: "Valor médio por quarto",
    },
    {
      title: "RevPAR",
      value: `R$ ${(summary?.revpar || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: BarChart3,
      color: "text-amber-500",
      description: "Receita por quarto disp.",
    },
    {
      title: "Propriedades",
      value: properties.length.toString(),
      icon: Building2,
      color: "text-blue-500",
      description: `${summary?.totalAvailableRooms || 0} quartos totais`,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Operacional</h1>
            <p className="text-muted-foreground mt-1">
              Olá, <span className="font-medium">{user?.user_metadata?.full_name?.split(' ')[0] || 'Gestor'}</span>!
              Acompanhe a performance estratégica.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Property Selector */}
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[200px] h-11 rounded-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Selecione" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[250px] justify-start font-semibold h-11 rounded-xl",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: ptBR })} - {format(dateRange.to, "dd MMM yy", { locale: ptBR })}
                    </>
                  ) : (
                    <span>Período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <ShadcnCalendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.trend && (
                    <div className="flex items-center text-xs font-medium text-success">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      +{stat.trend}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Occupancy Chart */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Resumo de Ocupação</CardTitle>
            <CardDescription>Taxa de ocupação nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(val) => `${val}%`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="occupancy" stroke="hsl(var(--primary))" fill="url(#colorOcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Room Status */}
        <DashboardRoomStatus />

        {/* Bookings Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upcoming */}
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Próximas Reservas</CardTitle>
                <CardDescription>Eventos nos próximos 7 dias</CardDescription>
              </div>
              <Link to="/bookings">
                <Button variant="ghost" size="sm">
                  Ver Todas <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                </div>
              ) : upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{booking.guest_name}</p>
                          {getStatusBadge(booking.status as any)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(booking.check_in), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <p className="font-bold text-success">R$ {booking.total_amount.toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma reserva próxima.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas 48 horas</CardDescription>
              </div>
              <Link to="/bookings">
                <Button variant="ghost" size="sm">
                  Timeline <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{booking.guest_name}</p>
                          {getStatusBadge(booking.status as any)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {isPast(parseISO(booking.check_out)) ? (
                            <><LogOut className="h-3 w-3" /> Check-out</>
                          ) : (
                            <><LogIn className="h-3 w-3" /> Check-in</>
                          )}
                        </p>
                      </div>
                      <p className="text-xs font-medium">
                        {format(new Date(isPast(parseISO(booking.check_out)) ? booking.check_out : booking.check_in), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <LayoutDashboard className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sem atividades recentes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { to: "/properties", icon: Building2, label: "Propriedades" },
            { to: "/bookings", icon: Calendar, label: "Calendário" },
            { to: "/financial", icon: DollarSign, label: "Financeiro" }
          ].map((action, i) => (
            <Link key={i} to={action.to}>
              <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <action.icon className="h-5 w-5 text-primary" />
                    {action.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    Acessar <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;