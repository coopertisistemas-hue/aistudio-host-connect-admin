import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { useBookings } from "@/hooks/useBookings";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, isFuture, isPast, subDays, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  BedDouble,
  ArrowRight,
  Clock,
  CheckCircle2,
  LogOut,
  LogIn,
  Percent,
  BarChart3,
  CalendarIcon,
} from "lucide-react";
import { getStatusBadge } from "@/lib/ui-helpers";
import DashboardRoomStatus from "@/components/DashboardRoomStatus";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const { properties } = useProperties();
  const { selectedPropertyId } = useSelectedProperty();
  const { bookings, isLoading: bookingsLoading } = useBookings();

  const defaultDateRange = useMemo(() => ({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: new Date(),
  }), []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  
  // Use o hook de resumo financeiro para o período selecionado
  const { summary, isLoading: summaryLoading } = useFinancialSummary(selectedPropertyId, dateRange as { from: Date; to: Date } | undefined); // Cast here
  
  const isLoading = bookingsLoading || summaryLoading;

  // Filter for upcoming bookings (check-in in the next 7 days)
  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .filter(b => isFuture(parseISO(b.check_in)) && parseISO(b.check_in) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sort((a, b) => parseISO(a.check_in).getTime() - parseISO(b.check_in).getTime())
    .slice(0, 5); // Show top 5 upcoming

  // Filter for recent activity (check-in or check-out in the last 7 days)
  const recentActivity = bookings
    .filter(b => {
      const checkInDate = parseISO(b.check_in);
      const checkOutDate = parseISO(b.check_out);
      const sevenDaysAgo = subDays(new Date(), 7);
      
      return (
        (isPast(checkInDate) && checkInDate >= sevenDaysAgo) || // Recent check-ins
        (isPast(checkOutDate) && checkOutDate >= sevenDaysAgo) // Recent check-outs
      );
    })
    .sort((a, b) => {
      const dateA = Math.max(parseISO(a.check_in).getTime(), parseISO(a.check_out).getTime());
      const dateB = Math.max(parseISO(b.check_in).getTime(), parseISO(b.check_out).getTime());
      return dateB - dateA; // Sort by most recent activity
    })
    .slice(0, 5); // Show top 5 recent activities

  const dateRangeLabel = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yy", { locale: ptBR })}`
    : 'Últimos 6 meses';

  const stats = [
    {
      title: "Taxa de Ocupação",
      value: `${summary.occupancyRate}%`,
      icon: Percent,
      color: "text-primary",
      description: `Período: ${dateRangeLabel}`,
    },
    {
      title: "Diária Média (ADR)",
      value: `R$ ${summary.adr.toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
      description: `Período: ${dateRangeLabel}`,
    },
    {
      title: "RevPAR",
      value: `R$ ${summary.revpar.toFixed(2)}`,
      icon: BarChart3,
      color: "text-accent",
      description: `Período: ${dateRangeLabel}`,
    },
    {
      title: "Propriedades Ativas",
      value: properties.length.toString(),
      icon: Building2,
      color: "text-primary",
      description: `${summary.totalAvailableRooms} quartos no total`,
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
              Bem-vindo de volta, {user?.user_metadata?.full_name || user?.email}!
            </p>
          </div>
          
          {/* Date Range Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full md:w-[250px] justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um intervalo de datas</span>
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

        {/* Stats Grid (KPIs) */}
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
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Room Status Overview */}
        <DashboardRoomStatus />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upcoming Bookings */}
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Próximas Reservas</CardTitle>
                  <CardDescription>Reservas com check-in nos próximos 7 dias</CardDescription>
                </div>
                <Link to="/bookings">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{booking.guest_name}</p>
                          {getStatusBadge(booking.status as any)}
                        </div>
                        {booking.properties && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {booking.properties.name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Check-in: {format(new Date(booking.check_in), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-success">R$ {booking.total_amount.toFixed(2)}</p>
                        <Link to="/bookings">
                          <Button variant="outline" size="sm" className="mt-2">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma reserva futura nos próximos 7 dias.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Check-ins e check-outs nos últimos 7 dias</CardDescription>
                </div>
                <Link to="/bookings">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{booking.guest_name}</p>
                          {getStatusBadge(booking.status as any)}
                        </div>
                        {booking.properties && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {booking.properties.name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {isPast(parseISO(booking.check_out)) ? (
                            <>
                              <LogOut className="h-4 w-4" />
                              Check-out: {format(new Date(booking.check_out), "dd MMM yyyy", { locale: ptBR })}
                            </>
                          ) : (
                            <>
                              <LogIn className="h-4 w-4" />
                              Check-in: {format(new Date(booking.check_in), "dd MMM yyyy", { locale: ptBR })}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-success">R$ {booking.total_amount.toFixed(2)}</p>
                        <Link to="/bookings">
                          <Button variant="outline" size="sm" className="mt-2">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma atividade recente nos últimos 7 dias.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link to="/properties">
            <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Propriedades
                </CardTitle>
                <CardDescription>Gerencie suas propriedades</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Acessar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link to="/bookings">
            <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Reservas
                </CardTitle>
                <CardDescription>Veja calendário e lista de reservas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Acessar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link to="/financial">
            <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  Financeiro
                </CardTitle>
                <CardDescription>Relatórios e despesas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Acessar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;