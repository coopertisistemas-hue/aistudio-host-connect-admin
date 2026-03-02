import { useMemo, useRef, useState } from "react";
import { endOfDay, format, parseISO, startOfDay, subDays } from "date-fns";
import { Download, Filter, Building2, Calendar, Printer, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookings } from "@/hooks/useBookings";
import { useProperties } from "@/hooks/useProperties";
import { useRooms } from "@/hooks/useRooms";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";

interface ReportFilters {
  dateRange: DateRange | undefined;
  status: string;
  roomType: string;
}

const ReportPage = () => {
  const { selectedPropertyId } = useSelectedProperty();
  const { properties } = useProperties();
  const { bookings, isLoading: bookingsLoading } = useBookings(selectedPropertyId || undefined);
  const { rooms } = useRooms(selectedPropertyId || undefined);

  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: undefined,
    status: "all",
    roomType: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const selectedPropertyName = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId)?.name || "todas-propriedades",
    [properties, selectedPropertyId]
  );

  const roomTypes = useMemo(() => {
    const types = new Set(rooms.map((room) => room.room_types?.name).filter(Boolean));
    return Array.from(types) as string[];
  }, [rooms]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((booking) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesGuest = booking.guest_name?.toLowerCase().includes(query);
        const matchesEmail = booking.guest_email?.toLowerCase().includes(query);
        if (!matchesGuest && !matchesEmail) return false;
      }

      if (filters.status !== "all" && booking.status !== filters.status) {
        return false;
      }

      if (filters.roomType !== "all") {
        const bookingRoomType = booking.room_types?.name || "";
        if (bookingRoomType !== filters.roomType) return false;
      }

      if (filters.dateRange?.from && filters.dateRange?.to) {
        const checkIn = parseISO(booking.check_in);
        const checkOut = parseISO(booking.check_out);
        const rangeFrom = startOfDay(filters.dateRange.from);
        const rangeTo = endOfDay(filters.dateRange.to);
        const overlaps = checkIn <= rangeTo && checkOut >= rangeFrom;
        if (!overlaps) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, filters]);

  const kpis = useMemo(() => {
    if (!filteredBookings.length) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        totalGuests: 0,
        totalRevenue: 0,
      };
    }

    return {
      total: filteredBookings.length,
      confirmed: filteredBookings.filter((booking) => booking.status === "confirmed").length,
      pending: filteredBookings.filter((booking) => booking.status === "pending").length,
      completed: filteredBookings.filter((booking) => booking.status === "completed").length,
      cancelled: filteredBookings.filter((booking) => booking.status === "cancelled").length,
      totalGuests: filteredBookings.reduce((sum, booking) => sum + (booking.total_guests || 0), 0),
      totalRevenue: filteredBookings.reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0),
    };
  }, [filteredBookings]);

  const escapeCsv = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const handleExportCSV = () => {
    const headers = ["ID", "Hospede", "Email", "Check-in", "Check-out", "Status", "Hospedes", "Valor Total", "Tipo Quarto"];
    const rows = filteredBookings.map((booking) => [
      escapeCsv(booking.id),
      escapeCsv(booking.guest_name),
      escapeCsv(booking.guest_email),
      escapeCsv(format(parseISO(booking.check_in), "dd/MM/yyyy")),
      escapeCsv(format(parseISO(booking.check_out), "dd/MM/yyyy")),
      escapeCsv(booking.status),
      escapeCsv(booking.total_guests),
      escapeCsv(Number(booking.total_amount).toFixed(2)),
      escapeCsv(booking.room_types?.name || ""),
    ]);

    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.join(","))].join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const propertySlug = selectedPropertyName.toLowerCase().replace(/\s+/g, "-");
    link.download = `reservas_${propertySlug}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  const setQuickRange = (days: number) => {
    setFilters((previous) => ({
      ...previous,
      dateRange: {
        from: subDays(new Date(), days),
        to: new Date(),
      },
    }));
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilters({ dateRange: undefined, status: "all", roomType: "all" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" ref={printRef}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatorio de Reservas</h1>
            <p className="text-muted-foreground mt-1">Analise detalhada com filtros inteligentes e exportacao.</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Escopo: {selectedPropertyName}
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

        <div className="flex flex-wrap gap-2 no-print">
          <Button type="button" variant="outline" size="sm" onClick={() => setQuickRange(7)}>Ultimos 7 dias</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setQuickRange(30)}>Ultimos 30 dias</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setQuickRange(90)}>Ultimos 90 dias</Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-3.5 w-3.5 mr-1" /> Limpar filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="relative">
            <Input
              placeholder="Buscar por hospede..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
            <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          <Select value={filters.status} onValueChange={(value) => setFilters((previous) => ({ ...previous, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="completed">Concluidas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateRange?.from
                  ? filters.dateRange.to
                    ? `${format(filters.dateRange.from, "dd/MM/yy")} - ${format(filters.dateRange.to, "dd/MM/yy")}`
                    : format(filters.dateRange.from, "dd/MM/yy")
                  : "Periodo"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <ShadcnCalendar
                mode="range"
                selected={filters.dateRange}
                onSelect={(range) => setFilters((previous) => ({ ...previous, dateRange: range }))}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={filters.roomType} onValueChange={(value) => setFilters((previous) => ({ ...previous, roomType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Quarto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {roomTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{kpis.total}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card className="border-yellow-500/50"><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{kpis.pending}</div><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
          <Card className="border-green-500/50"><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{kpis.confirmed}</div><p className="text-xs text-muted-foreground">Confirmadas</p></CardContent></Card>
          <Card className="border-blue-500/50"><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{kpis.completed}</div><p className="text-xs text-muted-foreground">Concluidas</p></CardContent></Card>
          <Card className="border-red-500/50"><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{kpis.cancelled}</div><p className="text-xs text-muted-foreground">Canceladas</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{kpis.totalGuests}</div><p className="text-xs text-muted-foreground">Hospedes</p></CardContent></Card>
          <Card className="col-span-2"><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">R$ {kpis.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">Receita Total</p></CardContent></Card>
        </div>

        <div className="text-sm text-muted-foreground">Mostrando {filteredBookings.length} de {bookings?.length || 0} reservas</div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Hospede</th>
                    <th className="text-left p-4 font-medium">Tipo Quarto</th>
                    <th className="text-left p-4 font-medium">Check-in</th>
                    <th className="text-left p-4 font-medium">Check-out</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Hospedes</th>
                    <th className="text-right p-4 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">Carregando relatorio...</td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma reserva encontrada com os filtros selecionados.</td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="font-medium">{booking.guest_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.guest_email}</div>
                        </td>
                        <td className="p-4">{booking.room_types?.name || "-"}</td>
                        <td className="p-4">{format(parseISO(booking.check_in), "dd/MM/yyyy")}</td>
                        <td className="p-4">{format(parseISO(booking.check_out), "dd/MM/yyyy")}</td>
                        <td className="p-4">
                          <Badge variant={
                            booking.status === "confirmed" ? "default" :
                            booking.status === "pending" ? "secondary" :
                            booking.status === "completed" ? "outline" : "destructive"
                          }>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">{booking.total_guests}</td>
                        <td className="p-4 text-right font-medium">R$ {Number(booking.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="hidden print:block text-center text-sm text-muted-foreground pt-8 border-t">
          Relatorio gerado em {format(new Date(), "dd/MM/yyyy 'as' HH:mm")}
        </div>
      </div>

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
