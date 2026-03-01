import { useMemo, useState, useRef } from "react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Printer, Filter, Calendar, Building2, Users, LogIn, LogOut, DollarSign, BedDouble, TrendingUp, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { useBookings } from "@/hooks/useBookings";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useRooms } from "@/hooks/useRooms";
import { cn } from "@/lib/utils";

interface ReportFilters {
  dateRange: DateRange | undefined;
  status: string;
  roomType: string;
}

const ReportPage = () => {
  const { selectedPropertyId } = useSelectedProperty();
  const { bookings, isLoading: bookingsLoading } = useBookings(selectedPropertyId || undefined);
  const { rooms } = useRooms(selectedPropertyId || undefined);
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: undefined,
    status: "all",
    roomType: "all",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // Get unique room types
  const roomTypes = useMemo(() => {
    const types = new Set(rooms?.map(r => r.room_types?.name).filter(Boolean));
    return Array.from(types);
  }, [rooms]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    return bookings.filter(booking => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesGuest = booking.guest_name?.toLowerCase().includes(query);
        const matchesEmail = booking.guest_email?.toLowerCase().includes(query);
        if (!matchesGuest && !matchesEmail) return false;
      }
      
      // Status filter
      if (filters.status !== "all" && booking.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const checkIn = parseISO(booking.check_in);
        const checkOut = parseISO(booking.check_out);
        const rangeFrom = startOfDay(filters.dateRange.from);
        const rangeTo = endOfDay(filters.dateRange.to);
        
        // Check if booking overlaps with date range
        const overlaps = checkIn <= rangeTo && checkOut >= rangeFrom;
        if (!overlaps) return false;
      }
      
      return true;
    });
  }, [bookings, searchQuery, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!filteredBookings.length) return {
      total: 0,
      confirmed: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      totalGuests: 0,
      totalRevenue: 0,
    };
    
    return {
      total: filteredBookings.length,
      confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
      pending: filteredBookings.filter(b => b.status === 'pending').length,
      completed: filteredBookings.filter(b => b.status === 'completed').length,
      cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
      totalGuests: filteredBookings.reduce((sum, b) => sum + (b.total_guests || 0), 0),
      totalRevenue: filteredBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
    };
  }, [filteredBookings]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Hóspede", "Email", "Check-in", "Check-out", "Status", "Hóspedes", "Valor Total"];
    const rows = filteredBookings.map(b => [
      b.id,
      b.guest_name,
      b.guest_email,
      format(parseISO(b.check_in), "dd/MM/yyyy"),
      format(parseISO(b.check_out), "dd/MM/yyyy"),
      b.status,
      b.total_guests,
      Number(b.total_amount).toFixed(2),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Add BOM for Excel compatibility
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" ref={printRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatório de Reservas</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada de reservas com filtros e exportação
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Buscar por hóspede..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    `${format(filters.dateRange.from, "dd/MM/yy")} - ${format(filters.dateRange.to, "dd/MM/yy")}`
                  ) : (
                    format(filters.dateRange.from, "dd/MM/yy")
                  )
                ) : (
                  "Período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <ShadcnCalendar
                mode="range"
                selected={filters.dateRange}
                onSelect={(range) => setFilters(f => ({ ...f, dateRange: range }))}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Room Type Filter */}
          <Select value={filters.roomType} onValueChange={(v) => setFilters(f => ({ ...f, roomType: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Quarto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {roomTypes.map(type => (
                <SelectItem key={type} value={type!}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{kpis.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{kpis.pending}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{kpis.confirmed}</div>
              <p className="text-xs text-muted-foreground">Confirmadas</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{kpis.completed}</div>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{kpis.cancelled}</div>
              <p className="text-xs text-muted-foreground">Canceladas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{kpis.totalGuests}</div>
              <p className="text-xs text-muted-foreground">Hóspedes</p>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                R$ {kpis.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Receita Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredBookings.length} de {bookings?.length || 0} reservas
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Hóspede</th>
                    <th className="text-left p-4 font-medium">Check-in</th>
                    <th className="text-left p-4 font-medium">Check-out</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Hóspedes</th>
                    <th className="text-right p-4 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhuma reserva encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="font-medium">{booking.guest_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.guest_email}</div>
                        </td>
                        <td className="p-4">
                          {format(parseISO(booking.check_in), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          {format(parseISO(booking.check_out), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <Badge variant={
                            booking.status === 'confirmed' ? 'default' :
                            booking.status === 'pending' ? 'secondary' :
                            booking.status === 'completed' ? 'outline' :
                            'destructive'
                          }>
                            {booking.status === 'confirmed' ? 'Confirmada' :
                             booking.status === 'pending' ? 'Pendente' :
                             booking.status === 'completed' ? 'Concluída' :
                             'Cancelada'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">{booking.total_guests}</td>
                        <td className="p-4 text-right font-medium">
                          R$ {Number(booking.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Print-only footer */}
        <div className="hidden print:block text-center text-sm text-muted-foreground pt-8 border-t">
          Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print\\:block { display: block !important; }
          body { font-size: 12px; }
          table { font-size: 10px; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ReportPage;
