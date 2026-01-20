import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useProperties } from '@/hooks/useProperties';
import { useExpenses } from '@/hooks/useExpenses';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import { DollarSign, TrendingUp, Calendar, PieChart, Wallet, FileText, Download, CalendarIcon, Home, Percent, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Link } from "react-router-dom";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useAuth } from "@/hooks/useAuth";

const Financial = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const defaultDateRange = useMemo(() => ({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: new Date(),
  }), []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);

  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { expenses, isLoading: expensesLoading } = useExpenses(selectedPropertyId);
  // Ensure dateRange.to is always defined for useFinancialSummary
  const { summary, isLoading: summaryLoading } = useFinancialSummary(
    selectedPropertyId,
    dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined
  );

  const isLoading = bookingsLoading || propertiesLoading || expensesLoading || summaryLoading || propertyStateLoading;

  const filteredBookings = useMemo(() => {
    let filtered = selectedPropertyId
      ? bookings.filter(b => b.property_id === selectedPropertyId)
      : bookings;

    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(b => {
        // Use created_at for filtering in the financial view
        const createdDate = parseISO(b.created_at);
        return isWithinInterval(createdDate, { start: dateRange.from!, end: dateRange.to! });
      });
    }
    return filtered;
  }, [bookings, selectedPropertyId, dateRange]);

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.expense_date);
        // Filter expenses where expense date falls within the selected range
        return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to! });
      });
    }
    return filtered;
  }, [expenses, dateRange]);

  const stats = useMemo(() => {
    // Revenue calculation based on filtered bookings (by created_at)
    const totalRevenue = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const confirmedRevenue = filteredBookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const pendingRevenue = filteredBookings
      .filter(b => b.status === 'pending')
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const totalBookings = filteredBookings.length;
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, confirmedRevenue, pendingRevenue, totalBookings, totalExpenses, netProfit };
  }, [filteredBookings, filteredExpenses]);

  const revenueByProperty = useMemo(() => {
    const propertyMap = new Map<string, number>();

    // Use confirmed/completed bookings for revenue calculation
    bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').forEach(booking => {
      const propertyName = booking.properties?.name || 'N/A';
      const current = propertyMap.get(propertyName) || 0;
      propertyMap.set(propertyName, current + Number(booking.total_amount));
    });

    return Array.from(propertyMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  }, [bookings, properties]);

  const monthlyData = useMemo(() => {
    const start = dateRange?.from || startOfMonth(subMonths(new Date(), 5));
    const end = dateRange?.to || new Date();

    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const revenue = filteredBookings
        .filter(booking => {
          const createdDate = parseISO(booking.created_at);
          // Use created_at for monthly revenue aggregation
          return (booking.status === 'confirmed' || booking.status === 'completed') && isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

      const expense = filteredExpenses
        .filter(exp => {
          const expDate = new Date(exp.expense_date);
          return isWithinInterval(expDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        receita: Number(revenue.toFixed(2)),
        despesas: Number(expense.toFixed(2)),
        lucro: Number((revenue - expense).toFixed(2)),
      };
    });
  }, [filteredBookings, filteredExpenses, dateRange]);

  const statusDistribution = useMemo(() => {
    const statusMap = {
      pending: { label: 'Pendente', count: 0 },
      confirmed: { label: 'Confirmado', count: 0 },
      cancelled: { label: 'Cancelado', count: 0 },
      completed: { label: 'Concluído', count: 0 }
    };

    filteredBookings.forEach(booking => {
      if (statusMap[booking.status]) {
        statusMap[booking.status].count++;
      }
    });

    return Object.values(statusMap).map(item => ({
      name: item.label,
      value: item.count
    }));
  }, [filteredBookings]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Análise completa de receitas e despesas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione a propriedade e o intervalo de datas para visualizar os dados financeiros.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <Select
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
              disabled={propertiesLoading || properties.length === 0 || propertyStateLoading}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecione uma propriedade" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.name} ({prop.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um intervalo de datas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
          </CardContent>
        </Card>

        {isLoading ? (
          <DataTableSkeleton rows={4} columns={4} />
        ) : !selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para visualizar seus dados financeiros.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {!isViewer ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        De {stats.totalBookings} reservas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats.totalExpenses.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        Despesas registradas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats.netProfit.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        Receita - Despesas
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <PieChart className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Dados financeiros detalhados restritos a administradores.</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    RevPAR: R$ {summary.revpar.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diária Média (ADR)</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {summary.adr.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Média por noite ocupada
                  </p>
                </CardContent>
              </Card>
            </div>

            {!isViewer ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fluxo de Caixa Mensal (Receita vs. Despesas)</CardTitle>
                      <CardDescription>No período selecionado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                          <Legend />
                          <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} />
                          <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} />
                          <Line type="monotone" dataKey="lucro" stroke="hsl(var(--success))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Receita por Propriedade</CardTitle>
                      <CardDescription>Distribuição de receita (todas as reservas)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByProperty}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                          <Legend />
                          <Bar dataKey="value" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Status das Reservas</CardTitle>
                    <CardDescription>No período selecionado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartPieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-60">
                  <BarChart3 className="h-16 w-16 mb-4" />
                  <p>Gráficos e analytics financeiros estão disponíveis apenas para administradores.</p>
                </CardContent>
              </Card>
            )}

            {/* Advanced Reports Section - Placeholders */}
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Avançados</CardTitle>
                <CardDescription>Gere relatórios detalhados e exporte para análise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Relatório de Previsibilidade Financeira</p>
                  <Button variant="outline" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório (Em Breve)
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Exportar Dados (CSV/PDF)</p>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar (Em Breve)
                  </Button>
                </div>
                <Link to="/expenses">
                  <Button variant="secondary" className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Gerenciar Despesas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Financial;