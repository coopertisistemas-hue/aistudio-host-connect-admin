import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useProperties } from '@/hooks/useProperties';
import { useExpenses } from '@/hooks/useExpenses';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import { useInvoices } from '@/hooks/useInvoices';
import { DollarSign, TrendingUp, PieChart, Wallet, FileText, Download, CalendarIcon, Home, Percent, BarChart3, RotateCcw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell } from 'recharts';
import { useMemo, useState } from 'react';
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
import { useOrg } from "@/hooks/useOrg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatus, normalizeLegacyStatus } from "@/lib/constants/statuses";

type OrchestrationEvent = {
  id: string;
  event_type: string;
  idempotency_key: string;
  external_reservation_id: string | null;
  status: 'received' | 'processing' | 'processed' | 'failed';
  created_at: string;
  processed_at: string | null;
};

const Financial = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const { userRole } = useAuth();
  const { currentOrgId } = useOrg();
  const isViewer = userRole === 'viewer';

  const defaultDateRange = useMemo(() => ({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: new Date(),
  }), []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);

  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { expenses, isLoading: expensesLoading } = useExpenses(selectedPropertyId);
  const { invoices, isLoading: invoicesLoading } = useInvoices(selectedPropertyId || undefined);
  // Ensure dateRange.to is always defined for useFinancialSummary
  const { summary, isLoading: summaryLoading } = useFinancialSummary(
    selectedPropertyId,
    dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined
  );

  const isLoading = bookingsLoading || propertiesLoading || expensesLoading || invoicesLoading || summaryLoading || propertyStateLoading;

  const { data: orchestrationEvents = [], isLoading: orchestrationLoading } = useQuery({
    queryKey: ['reservation-orchestration-events', currentOrgId, selectedPropertyId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!currentOrgId || !selectedPropertyId) return [];

      let query = supabase
        .from('reservation_orchestration_events')
        .select('id, event_type, idempotency_key, external_reservation_id, status, created_at, processed_at')
        .eq('org_id', currentOrgId)
        .eq('property_id', selectedPropertyId);

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as OrchestrationEvent[];
    },
    enabled: !!currentOrgId && !!selectedPropertyId && !isViewer,
  });

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

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((invoice) => {
        const referenceDate = invoice.issue_date ? new Date(invoice.issue_date) : new Date(invoice.created_at);
        return isWithinInterval(referenceDate, { start: dateRange.from!, end: dateRange.to! });
      });
    }
    return filtered;
  }, [invoices, dateRange]);

  const isPreArrivalStatus = (status: string): boolean => {
    const normalized = normalizeLegacyStatus(status);
    return normalized === BookingStatus.RESERVED || normalized === BookingStatus.PRE_CHECKIN;
  };

  const isRevenueRecognizedStatus = (status: string): boolean => {
    const normalized = normalizeLegacyStatus(status);
    return normalized === BookingStatus.CHECKED_IN || normalized === BookingStatus.IN_HOUSE || normalized === BookingStatus.CHECKED_OUT;
  };

  const isCancelledStatus = (status: string): boolean => {
    const normalized = normalizeLegacyStatus(status);
    return normalized === BookingStatus.CANCELLED || normalized === BookingStatus.NO_SHOW;
  };

  const stats = useMemo(() => {
    const totalRevenue = filteredBookings.filter((b) => isRevenueRecognizedStatus(b.status)).reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const confirmedRevenue = totalRevenue;
    const pendingRevenue = filteredBookings
      .filter((b) => isPreArrivalStatus(b.status))
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const totalBookings = filteredBookings.length;
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, confirmedRevenue, pendingRevenue, totalBookings, totalExpenses, netProfit };
  }, [filteredBookings, filteredExpenses]);

  const settlementStats = useMemo(() => {
    const bookedValue = filteredBookings
      .filter((b) => !isCancelledStatus(b.status))
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const realizedValue = filteredBookings
      .filter((b) => {
        const normalized = normalizeLegacyStatus(b.status);
        return normalized === BookingStatus.CHECKED_OUT;
      })
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const invoicedValue = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
    const paidValue = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0);
    const outstandingValue = Math.max(0, invoicedValue - paidValue);
    const collectionRate = invoicedValue > 0 ? (paidValue / invoicedValue) * 100 : 0;
    const realizationRate = bookedValue > 0 ? (realizedValue / bookedValue) * 100 : 0;

    return {
      bookedValue: Number(bookedValue.toFixed(2)),
      realizedValue: Number(realizedValue.toFixed(2)),
      invoicedValue: Number(invoicedValue.toFixed(2)),
      paidValue: Number(paidValue.toFixed(2)),
      outstandingValue: Number(outstandingValue.toFixed(2)),
      collectionRate: Number(collectionRate.toFixed(1)),
      realizationRate: Number(realizationRate.toFixed(1)),
      invoiceCount: filteredInvoices.length,
    };
  }, [filteredBookings, filteredInvoices]);

  const integrationFeedback = useMemo(() => {
    const failed = orchestrationEvents.filter((event) => event.status === 'failed');
    const processing = orchestrationEvents.filter((event) => event.status === 'processing');
    const now = Date.now();
    const staleProcessing = processing.filter((event) => now - new Date(event.created_at).getTime() > 15 * 60 * 1000);

    const pendingSettlement = filteredInvoices.filter((invoice) => {
      const status = String(invoice.status || '').toLowerCase();
      return status === 'pending' || status === 'partially_paid';
    });

    const overdueSettlement = pendingSettlement.filter((invoice) => {
      if (!invoice.due_date) return false;
      return new Date(invoice.due_date).getTime() < now;
    });

    const checkedOutNoPaidInvoice = filteredBookings.filter((booking) => {
      const normalized = normalizeLegacyStatus(booking.status);
      if (normalized !== BookingStatus.CHECKED_OUT) return false;
      const invoiceForBooking = filteredInvoices.find((invoice) => invoice.booking_id === booking.id);
      if (!invoiceForBooking) return true;
      const status = String(invoiceForBooking.status || '').toLowerCase();
      return status !== 'paid';
    });

    const anomalyRows = [
      ...failed.slice(0, 20).map((event) => ({
        created_at: event.created_at,
        type: 'orchestration_failed',
        reference: event.external_reservation_id || event.idempotency_key,
        detail: event.event_type,
      })),
      ...staleProcessing.slice(0, 20).map((event) => ({
        created_at: event.created_at,
        type: 'orchestration_stale_processing',
        reference: event.external_reservation_id || event.idempotency_key,
        detail: event.event_type,
      })),
      ...overdueSettlement.slice(0, 20).map((invoice) => ({
        created_at: invoice.due_date || invoice.created_at,
        type: 'settlement_overdue',
        reference: invoice.booking_id || invoice.id,
        detail: `invoice_status=${invoice.status}`,
      })),
      ...checkedOutNoPaidInvoice.slice(0, 20).map((booking) => ({
        created_at: booking.check_out,
        type: 'checkout_without_paid_invoice',
        reference: booking.id,
        detail: `booking_status=${booking.status}`,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30);

    return {
      failedCount: failed.length,
      processingCount: processing.length,
      staleProcessingCount: staleProcessing.length,
      pendingSettlementCount: pendingSettlement.length,
      overdueSettlementCount: overdueSettlement.length,
      checkedOutNoPaidInvoiceCount: checkedOutNoPaidInvoice.length,
      anomalies: anomalyRows,
    };
  }, [orchestrationEvents, filteredInvoices, filteredBookings]);

  const revenueByProperty = useMemo(() => {
    const propertyMap = new Map<string, number>();

    bookings.filter((b) => isRevenueRecognizedStatus(b.status)).forEach(booking => {
      const propertyName = booking.properties?.name || 'N/A';
      const current = propertyMap.get(propertyName) || 0;
      propertyMap.set(propertyName, current + Number(booking.total_amount));
    });

    return Array.from(propertyMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  }, [bookings]);

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
          return isRevenueRecognizedStatus(booking.status) && isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
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
    const statusMap: Record<string, { label: string; count: number }> = {
      pre_arrival: { label: 'Pre-chegada', count: 0 },
      in_stay: { label: 'Em hospedagem', count: 0 },
      checked_out: { label: 'Checkout', count: 0 },
      cancelled: { label: 'Cancelado/No-show', count: 0 }
    };

    filteredBookings.forEach((booking) => {
      const normalized = normalizeLegacyStatus(booking.status);
      if (normalized === BookingStatus.RESERVED || normalized === BookingStatus.PRE_CHECKIN) {
        statusMap.pre_arrival.count++;
      } else if (normalized === BookingStatus.CHECKED_IN || normalized === BookingStatus.IN_HOUSE) {
        statusMap.in_stay.count++;
      } else if (normalized === BookingStatus.CHECKED_OUT) {
        statusMap.checked_out.count++;
      } else if (normalized === BookingStatus.CANCELLED || normalized === BookingStatus.NO_SHOW) {
        statusMap.cancelled.count++;
      }
    });

    return Object.values(statusMap).map((item) => ({
      name: item.label,
      value: item.count
    }));
  }, [filteredBookings]);

  const handleExportSettlementCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['booked_value', settlementStats.bookedValue.toFixed(2)],
      ['realized_value', settlementStats.realizedValue.toFixed(2)],
      ['invoiced_value', settlementStats.invoicedValue.toFixed(2)],
      ['paid_value', settlementStats.paidValue.toFixed(2)],
      ['outstanding_value', settlementStats.outstandingValue.toFixed(2)],
      ['collection_rate_pct', settlementStats.collectionRate.toFixed(1)],
      ['realization_rate_pct', settlementStats.realizationRate.toFixed(1)],
      ['invoice_count', String(settlementStats.invoiceCount)],
    ];
    const csvContent = rows.map((line) => line.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settlement_reconciliation_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFeedbackCsv = () => {
    const rows = [
      ['created_at', 'anomaly_type', 'reference', 'detail'],
      ...integrationFeedback.anomalies.map((row) => [row.created_at, row.type, row.reference, row.detail]),
    ];
    const csvContent = rows
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `integration_feedback_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financeiro</h1>
          <p className="text-muted-foreground">AnÃ¡lise completa de receitas e despesas</p>
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
                      <CardTitle className="text-sm font-medium">Lucro LÃ­quido</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Taxa de OcupaÃ§Ã£o</CardTitle>
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
                  <CardTitle className="text-sm font-medium">DiÃ¡ria MÃ©dia (ADR)</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {summary.adr.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    MÃ©dia por noite ocupada
                  </p>
                </CardContent>
              </Card>
            </div>

            {!isViewer && (
              <Card>
                <CardHeader>
                  <CardTitle>ConciliaÃ§Ã£o de Receita e LiquidaÃ§Ã£o</CardTitle>
                  <CardDescription>Booked x Realizado x Faturado x Pago no perÃ­odo selecionado.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Booked</p>
                    <p className="text-xl font-bold">R$ {settlementStats.bookedValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Realizado (Checkout)</p>
                    <p className="text-xl font-bold">R$ {settlementStats.realizedValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Faturado / Pago</p>
                    <p className="text-xl font-bold">
                      R$ {settlementStats.invoicedValue.toFixed(2)} / R$ {settlementStats.paidValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Aberto</p>
                    <p className="text-xl font-bold text-destructive">R$ {settlementStats.outstandingValue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Collection {settlementStats.collectionRate}% | Realization {settlementStats.realizationRate}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isViewer && (
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Operacional da Integracao</CardTitle>
                  <CardDescription>
                    Eventos falhos, retries em aberto e pendencias de settlement no periodo selecionado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Eventos Falhos</p>
                      <p className="text-xl font-bold text-destructive">{integrationFeedback.failedCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Processing em Aberto (&gt;15min)</p>
                      <p className="text-xl font-bold">{integrationFeedback.staleProcessingCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Settlement Pendente / Vencido</p>
                      <p className="text-xl font-bold">
                        {integrationFeedback.pendingSettlementCount} / {integrationFeedback.overdueSettlementCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Checkout sem Invoice Pago</p>
                      <p className="text-xl font-bold">{integrationFeedback.checkedOutNoPaidInvoiceCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Eventos em Processing</p>
                      <p className="text-xl font-bold">{integrationFeedback.processingCount}</p>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={handleExportFeedbackCsv} disabled={integrationFeedback.anomalies.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Excecoes CSV
                      </Button>
                    </div>
                  </div>

                  {orchestrationLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando feedback operacional...</p>
                  ) : integrationFeedback.anomalies.length === 0 ? (
                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                      Sem anomalias detectadas no periodo selecionado.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-4 gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-semibold">
                        <span>Data</span>
                        <span>Tipo</span>
                        <span>Referencia</span>
                        <span>Detalhe</span>
                      </div>
                      {integrationFeedback.anomalies.slice(0, 12).map((row) => (
                        <div key={`${row.type}-${row.reference}-${row.created_at}`} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs border-b last:border-b-0">
                          <span>{format(new Date(row.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          <span className="font-medium">{row.type}</span>
                          <span className="truncate">{row.reference}</span>
                          <span className="truncate">{row.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!isViewer ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fluxo de Caixa Mensal (Receita vs. Despesas)</CardTitle>
                      <CardDescription>No perÃ­odo selecionado</CardDescription>
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
                      <CardDescription>DistribuiÃ§Ã£o de receita (todas as reservas)</CardDescription>
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
                    <CardTitle>DistribuiÃ§Ã£o de Status das Reservas</CardTitle>
                    <CardDescription>No perÃ­odo selecionado</CardDescription>
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
                  <p>GrÃ¡ficos e analytics financeiros estÃ£o disponÃ­veis apenas para administradores.</p>
                </CardContent>
              </Card>
            )}

            {/* Advanced Reports Section - Placeholders */}
            <Card>
              <CardHeader>
                <CardTitle>RelatÃ³rios AvanÃ§ados</CardTitle>
                <CardDescription>Gere relatÃ³rios detalhados e exporte para anÃ¡lise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">RelatÃ³rio de Previsibilidade Financeira</p>
                  <Button variant="outline" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar RelatÃ³rio (Em Breve)
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Exportar Dados (CSV/PDF)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportSettlementCsv}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Conciliacao CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportFeedbackCsv}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Exportar Feedback CSV
                    </Button>
                  </div>
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

