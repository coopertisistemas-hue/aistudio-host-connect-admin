import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useBookings, Booking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { BookingStatus, getBookingStatusLabel, isActiveStay, isPreArrival } from "@/lib/constants/statuses";
import {
  Loader2,
  Home,
  LogIn,
  LogOut,
  Building2,
  Monitor,
  Search,
  FileText,
  Calendar,
  User,
  BedDouble
} from "lucide-react";
import { format, parseISO, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const FrontDeskPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId } = useSelectedProperty();
  const { userRole } = useAuth();
  const { currentOrgId } = useOrg();
  const { bookings, isLoading: bookingsLoading } = useBookings(selectedPropertyId);
  const isViewer = userRole === 'viewer';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  const today = startOfDay(new Date());

  // Filter bookings by property and compute sections
  const { arrivals, departures, inHouse } = useMemo(() => {
    const propertyBookings = selectedPropertyId
      ? bookings.filter(b => b.property_id === selectedPropertyId)
      : bookings;

    // Search filter
    const searchedBookings = searchQuery.trim()
      ? propertyBookings.filter(b =>
        b.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.guest_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.guest_document && b.guest_document.includes(searchQuery))
      )
      : propertyBookings;

    // Arrivals: check_in today AND status is pre-arrival (reserved or pre_checkin)
    const arrivalsToday = searchedBookings.filter(b => {
      const checkInDate = parseISO(b.check_in);
      return isSameDay(checkInDate, today) && isPreArrival(b.status as BookingStatus);
    });

    // Departures: check_out today AND status is active (checked_in or in_house)
    const departuresToday = searchedBookings.filter(b => {
      const checkOutDate = parseISO(b.check_out);
      return isSameDay(checkOutDate, today) && isActiveStay(b.status as BookingStatus);
    });

    // In-house: status is checked_in or in_house (regardless of date)
    const inHouseNow = searchedBookings.filter(b =>
      isActiveStay(b.status as BookingStatus)
    );

    return {
      arrivals: arrivalsToday,
      departures: departuresToday,
      inHouse: inHouseNow
    };
  }, [bookings, selectedPropertyId, searchQuery, today]);

  if (propertiesLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Inicializando Front Desk...</p>
            <p className="text-sm text-muted-foreground">Carregando propriedades</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedPropertyId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in zoom-in duration-500">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Selecione uma Propriedade</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Escolha a propriedade que deseja gerenciar no Front Desk.
            </p>
          </div>
          <Button onClick={() => navigate('/properties')} size="lg" className="rounded-xl shadow-lg">
            <Building2 className="mr-2 h-5 w-5" />
            Ir para Propriedades
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700 pb-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Front Desk</h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Operação em tempo real • {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar hóspede..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[240px] pl-9 rounded-xl"
                />
              </div>

              {/* Property Selector */}
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="w-[280px] h-12 rounded-xl font-semibold shadow-sm border-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id} className="font-medium rounded-lg">
                      {prop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Arrivals Today */}
          <Card className="border-none bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 overflow-hidden shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Chegadas Hoje
                    </p>
                  </div>
                  <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                    {arrivals.length}
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                    Reservas previstas
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <LogIn className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departures Today */}
          <Card className="border-none bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50 overflow-hidden shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Saídas Hoje
                    </p>
                  </div>
                  <p className="text-4xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                    {departures.length}
                  </p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
                    Partidas previstas
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <LogOut className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In-House */}
          <Card className="border-none bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 overflow-hidden shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Em Casa
                    </p>
                  </div>
                  <p className="text-4xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                    {inHouse.length}
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                    Hóspedes hospedados
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <BedDouble className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sections: Arrivals, Departures, In-House */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Arrivals Section */}
          <BookingSection
            title="Chegadas (Hoje)"
            icon={LogIn}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-50"
            bookings={arrivals}
            isLoading={bookingsLoading}
            onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
          />

          {/* Departures Section */}
          <BookingSection
            title="Saídas (Hoje)"
            icon={LogOut}
            iconColor="text-rose-600"
            bgColor="bg-rose-50"
            bookings={departures}
            isLoading={bookingsLoading}
            onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
          />

          {/* In-House Section */}
          <BookingSection
            title="Em Casa"
            icon={BedDouble}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            bookings={inHouse}
            isLoading={bookingsLoading}
            onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

// Booking Section Component
interface BookingSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  bookings: Booking[];
  isLoading: boolean;
  onOpenFolio: (bookingId: string) => void;
}

const BookingSection = ({ title, icon: Icon, iconColor, bgColor, bookings, isLoading, onOpenFolio }: BookingSectionProps) => {
  if (isLoading) {
    return (
      <Card className="border-none shadow-lg rounded-2xl">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg rounded-2xl">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {title}
          <Badge variant="secondary" className="ml-auto">
            {bookings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`h-12 w-12 rounded-full ${bgColor} flex items-center justify-center mb-3`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma reserva
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onOpenFolio={onOpenFolio}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Booking Card Component
interface BookingCardProps {
  booking: Booking;
  onOpenFolio: (bookingId: string) => void;
}

const BookingCard = ({ booking, onOpenFolio }: BookingCardProps) => {
  return (
    <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Guest Name & Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-sm truncate">
                {booking.guest_name || 'Hóspede'}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {getBookingStatusLabel(booking.status)}
            </Badge>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(parseISO(booking.check_in), 'dd/MM', { locale: ptBR })} - {format(parseISO(booking.check_out), 'dd/MM', { locale: ptBR })}
            </span>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onOpenFolio(booking.id)}
            size="sm"
            variant="outline"
            className="w-full text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Abrir Folio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FrontDeskPage;