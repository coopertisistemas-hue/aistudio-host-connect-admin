import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Booking } from "@/hooks/useBookings";
import { BookingStatus, getBookingStatusLabel, canCheckIn, canCheckOut, canCancel, canMarkNoShow, normalizeLegacyStatus } from "@/lib/constants/statuses";
import { useUpdateBookingStatus } from "@/hooks/useUpdateBookingStatus";
import { useUpdateRoomStatus } from "@/hooks/useUpdateRoomStatus";
import { useBookingRooms } from "@/hooks/useBookingRooms";
import { useToast } from "@/hooks/use-toast";
import { FrontDeskBookingCard } from "@/components/frontdesk/FrontDeskBookingCard";
import { QuickBookingDialog } from "@/components/bookings/QuickBookingDialog";
import { GuidedCheckinPanel } from "@/components/frontdesk/GuidedCheckinPanel";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";
import { EmptyState } from "@/components/onboarding/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  BedDouble,
  Check,
  X,
  Ban,
  AlertCircle,
  Users,
  Plus
} from "lucide-react";
import { format, startOfDay, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const FrontDeskPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId } = useSelectedProperty();
  const { userRole } = useAuth();
  const { currentOrgId } = useOrg();
  const isViewer = userRole === 'viewer';
  const navigate = useNavigate();

  // Date filter state for peak mode
  type DateFilter = 'today' | 'tomorrow' | 'yesterday' | 'all';
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('today');

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const selectedDateValue = useMemo(() => {
    const base = startOfDay(new Date());
    switch (selectedDateFilter) {
      case 'yesterday': return format(addDays(base, -1), 'yyyy-MM-dd');
      case 'tomorrow': return format(addDays(base, 1), 'yyyy-MM-dd');
      case 'all': return null;
      default: return today;
    }
  }, [selectedDateFilter, today]);

  // Quick booking dialog state
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  // ===== SPRINT 5.5 TASK 3: GUIDED CHECK-IN PANEL STATE =====
  const [selectedCheckinBookingId, setSelectedCheckinBookingId] = useState<string | null>(null);
  const [showCheckinConfirmation, setShowCheckinConfirmation] = useState(false);

  // ===== SPRINT 5.5: DEDICATED ARRIVALS TODAY QUERY =====
  // Separate query for arrivals today - focused on operational clarity
  const { data: arrivalsToday = [], isLoading: arrivalsTodayLoading } = useQuery({
    queryKey: ['frontdesk-arrivals-today', currentOrgId, selectedPropertyId, today],
    queryFn: async () => {
      if (!currentOrgId) return [];

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('org_id', currentOrgId)
        .eq('check_in', today) // Strict: only today's arrivals
        .in('status', ['reserved', 'pre_checkin']) // Only pre-arrival statuses
        .order('check_in', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(50);

      if (selectedPropertyId) {
        query = query.eq('property_id', selectedPropertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrgId,
  });

  // Arrivals Query: check_in based on selected date, pre-arrival statuses, limit 50, ordered ASC
  const { data: arrivals = [], isLoading: arrivalsLoading } = useQuery({
    queryKey: ['frontdesk-arrivals', currentOrgId, selectedPropertyId, selectedDateValue],
    queryFn: async () => {
      if (!currentOrgId) return [];

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('org_id', currentOrgId)
        .in('status', ['reserved', 'pre_checkin', 'pending', 'confirmed'])
        .order('check_in', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(50);

      if (selectedPropertyId) {
        query = query.eq('property_id', selectedPropertyId);
      }

      if (selectedDateValue) {
        query = query.gte('check_in', selectedDateValue).lte('check_in', selectedDateValue);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrgId && !!selectedPropertyId,
  });

  // Departures Query: check_out based on selected date, active statuses, limit 50, ordered ASC
  const { data: departures = [], isLoading: departuresLoading } = useQuery({
    queryKey: ['frontdesk-departures', currentOrgId, selectedPropertyId, selectedDateValue],
    queryFn: async () => {
      if (!currentOrgId) return [];

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('org_id', currentOrgId)
        .in('status', ['checked_in', 'in_house', 'confirmed'])
        .order('check_out', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(50);

      if (selectedPropertyId) {
        query = query.eq('property_id', selectedPropertyId);
      }

      if (selectedDateValue) {
        query = query.gte('check_out', selectedDateValue).lte('check_out', selectedDateValue);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrgId && !!selectedPropertyId,
  });

  // In-House Query: active statuses, limit 50, ordered by check_in ASC
  const { data: inHouse = [], isLoading: inHouseLoading } = useQuery({
    queryKey: ['frontdesk-inhouse', currentOrgId, selectedPropertyId],
    queryFn: async () => {
      if (!currentOrgId) return [];

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('org_id', currentOrgId)
        .in('status', ['checked_in', 'in_house', 'confirmed'])
        .order('check_in', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(50);

      if (selectedPropertyId) {
        query = query.eq('property_id', selectedPropertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrgId && !!selectedPropertyId,
  });

  const isLoading = arrivalsLoading || departuresLoading || inHouseLoading;

  //  const [searchQuery, setSearchQuery] = useState('');

  // ===== SPRINT 5.5: ARRIVAL READINESS MODEL (INTERNAL) =====
  type ArrivalReadiness = {
    status: 'READY' | 'WARNING' | 'BLOCKED';
    reasons: Array<'ROOM' | 'PRIMARY_GUEST' | 'PRECHECKIN'>;
  };

  // Helper function to compute readiness (internal use, no UI yet)
  const computeArrivalReadiness = (
    bookingId: string,
    hasRoom: boolean,
    hasPrimaryGuest: boolean,
    hasPendingPrecheckin: boolean
  ): ArrivalReadiness => {
    const reasons: Array<'ROOM' | 'PRIMARY_GUEST' | 'PRECHECKIN'> = [];

    if (!hasRoom) reasons.push('ROOM');
    if (!hasPrimaryGuest) reasons.push('PRIMARY_GUEST');
    if (hasPendingPrecheckin) reasons.push('PRECHECKIN');

    // Blocked if missing room OR primary guest
    if (!hasRoom || !hasPrimaryGuest) {
      return { status: 'BLOCKED', reasons };
    }

    // Warning if pending precheckin
    if (hasPendingPrecheckin) {
      return { status: 'WARNING', reasons };
    }

    return { status: 'READY', reasons: [] };
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Batched queries for operational alerts (pilot-safe, fail closed)
  const allDisplayedBookingIds = useMemo(() => {
    return [...arrivalsToday, ...arrivals, ...departures, ...inHouse].map(b => b.id);
  }, [arrivalsToday, arrivals, departures, inHouse]);

  const { data: precheckinSessions = [] } = useQuery({
    queryKey: ['precheckin-sessions-batch', currentOrgId, selectedPropertyId, today, allDisplayedBookingIds.join(',')],
    queryFn: async () => {
      if (!currentOrgId || allDisplayedBookingIds.length === 0) return [];

      const { data, error } = await supabase
        .from('precheckin_sessions')
        .select('booking_id, status')
        .eq('org_id', currentOrgId)
        .in('booking_id', allDisplayedBookingIds);

      if (error) {
        console.warn('[FrontDesk] Precheckin sessions query failed:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentOrgId && allDisplayedBookingIds.length > 0,
  });

  const { data: bookingGuests = [] } = useQuery({
    queryKey: ['booking-guests-batch', currentOrgId, selectedPropertyId, today, allDisplayedBookingIds.join(',')],
    queryFn: async () => {
      if (!currentOrgId || allDisplayedBookingIds.length === 0) return [];

      const { data, error } = await supabase
        .from('booking_guests')
        .select('booking_id, is_primary')
        .eq('org_id', currentOrgId)
        .in('booking_id', allDisplayedBookingIds);

      if (error) {
        console.warn('[FrontDesk] Booking guests query failed:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentOrgId && allDisplayedBookingIds.length > 0,
  });

  // Batched booking groups query for group tag display
  const { data: bookingGroups = [] } = useQuery({
    queryKey: ['booking-groups-batch', currentOrgId, selectedPropertyId, today, allDisplayedBookingIds.join(',')],
    queryFn: async () => {
      if (!currentOrgId || allDisplayedBookingIds.length === 0) return [];

      const { data, error } = await (supabase as any)
        .from('booking_groups')
        .select('booking_id, group_name')
        .eq('org_id', currentOrgId)
        .in('booking_id', allDisplayedBookingIds);

      if (error) {
        console.warn('[FrontDesk] Booking groups query failed:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentOrgId && allDisplayedBookingIds.length > 0,
  });

  // Compute alert states (client-side)
  const alertStates = useMemo(() => {
    const states: Record<string, { precheckinPending: boolean; noPrimaryGuest: boolean; arrivalNoCheckin: boolean }> = {};

    allDisplayedBookingIds.forEach(bookingId => {
      const booking = [...arrivalsToday, ...arrivals, ...departures, ...inHouse].find(b => b.id === bookingId);
      if (!booking) return;

      const normalizedStatus = normalizeLegacyStatus(booking.status);

      // Alert: Pré-check-in pendente
      const sessions = precheckinSessions.filter(s => s.booking_id === bookingId);
      const hasPendingPrecheckin = sessions.some(s => s.status === 'pending' || s.status === 'incomplete');

      // Alert: Sem hóspede principal
      const guests = bookingGuests.filter(g => g.booking_id === bookingId);
      const hasPrimaryGuest = guests.some(g => g.is_primary === true);

      // Alert: Chegada hoje sem check-in (client-side)
      const isArrivalToday = booking.check_in === today;
      const isPreArrival = normalizedStatus === 'reserved' || normalizedStatus === 'pre_checkin';
      const arrivalNoCheckin = isArrivalToday && isPreArrival;

      states[bookingId] = {
        precheckinPending: hasPendingPrecheckin,
        noPrimaryGuest: !hasPrimaryGuest && guests.length === 0,
        arrivalNoCheckin,
      };
    });

    return states;
  }, [allDisplayedBookingIds, arrivalsToday, arrivals, departures, inHouse, precheckinSessions, bookingGuests, today]);

  // ===== SPRINT 5.5: ARRIVALS TODAY KPIS (CLIENT-SIDE) =====
  const arrivalsTodayKPIs = useMemo(() => {
    const total = arrivalsToday.length;
    let ready = 0;
    let withIssues = 0;

    arrivalsToday.forEach(booking => {
      const bookingRooms = bookingGuests.filter(g => g.booking_id === booking.id);
      const hasPrimaryGuest = bookingRooms.some(g => g.is_primary === true);
      const sessions = precheckinSessions.filter(s => s.booking_id === booking.id);
      const hasPendingPrecheckin = sessions.some(s => s.status === 'pending' || s.status === 'incomplete');

      // For now, we assume hasRoom is true if we need room data in future
      // This is a pilot-safe assumption pending room assignment tracking
      const hasRoom = !!(booking.primary_room_id || booking.room_id); // Task 2: Enhanced room check

      const readiness = computeArrivalReadiness(
        booking.id,
        hasRoom,
        hasPrimaryGuest,
        hasPendingPrecheckin
      );

      if (readiness.status === 'READY') {
        ready++;
      } else if (readiness.status === 'BLOCKED' || readiness.status === 'WARNING') {
        withIssues++;
      }
    });

    return { total, ready, withIssues };
  }, [arrivalsToday, bookingGuests, precheckinSessions, computeArrivalReadiness]);

  // ===== SPRINT 5.5 TASK 2: ARRIVALS TODAY READINESS MAP =====
  const arrivalsTodayReadiness = useMemo(() => {
    const map: Record<string, ArrivalReadiness> = {};

    arrivalsToday.forEach(booking => {
      const bookingRooms = bookingGuests.filter(g => g.booking_id === booking.id);
      const hasPrimaryGuest = bookingRooms.some(g => g.is_primary === true);
      const sessions = precheckinSessions.filter(s => s.booking_id === booking.id);
      const hasPendingPrecheckin = sessions.some(s => s.status === 'pending' || s.status === 'incomplete');

      const hasRoom = !!(booking.primary_room_id || booking.room_id);

      map[booking.id] = computeArrivalReadiness(
        booking.id,
        hasRoom,
        hasPrimaryGuest,
        hasPendingPrecheckin
      );
    });

    return map;
  }, [arrivalsToday, bookingGuests, precheckinSessions, computeArrivalReadiness]);

  // Client-side search filtering over DB-limited datasets
  const { filteredArrivals, filteredDepartures, filteredInHouse } = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    if (!search) {
      return {
        filteredArrivals: arrivals,
        filteredDepartures: departures,
        filteredInHouse: inHouse
      };
    }

    const filterBooking = (b: Booking) =>
      b.guest_name?.toLowerCase().includes(search) ||
      b.guest_email?.toLowerCase().includes(search) ||
      (b.guest_document && b.guest_document.includes(searchQuery.trim()));

    return {
      filteredArrivals: arrivals.filter(filterBooking),
      filteredDepartures: departures.filter(filterBooking),
      filteredInHouse: inHouse.filter(filterBooking)
    };
  }, [arrivals, departures, inHouse, searchQuery]);

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

  if (properties.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Front Desk</h1>
          </div>
          <OnboardingBanner />
          <Card className="border-dashed">
            <CardContent className="p-12">
              <EmptyState
                icon={Building2}
                title="Configuração inicial pendente"
                description="Para começar, crie sua primeira propriedade e seus quartos."
                primaryAction={!isViewer ? {
                  label: "Ir para configuração inicial",
                  onClick: () => navigate("/setup")
                } : undefined}
              />
            </CardContent>
          </Card>
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
              {/* Quick Booking Button - Non-viewer only */}
              {!isViewer && (
                <Button
                  onClick={() => setIsQuickBookingOpen(true)}
                  size="default"
                  className="h-12 rounded-xl shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Reserva Rápida
                </Button>
              )}

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
          {/* Date Filter Chips - Peak Mode */}
          <div className="flex gap-2">
            {(['today', 'tomorrow', 'yesterday', 'all'] as const).map((filter) => (
              <Button
                key={filter}
                variant={selectedDateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDateFilter(filter)}
                className="h-8"
              >
                {filter === 'today' && 'Hoje'}
                {filter === 'tomorrow' && 'Amanhã'}
                {filter === 'yesterday' && 'Ontem'}
                {filter === 'all' && 'Todos'}
              </Button>
            ))}
          </div>

          {/* Sprint 6.0: Onboarding Banner */}
          <OnboardingBanner />

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
                      {filteredArrivals.length}
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
                      {filteredDepartures.length}
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
                      {filteredInHouse.length}
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

          {/* ===== SPRINT 5.5: ARRIVALS TODAY QUEUE ===== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Chegadas de Hoje</h2>
                <p className="text-sm text-muted-foreground">Fila operacional - check-in previsto para hoje</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de chegadas</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{arrivalsTodayKPIs.total}</p>
                    </div>
                    <Calendar className="h-10 w-10 text-slate-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Prontas para check-in</p>
                      <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{arrivalsTodayKPIs.ready}</p>
                    </div>
                    <Check className="h-10 w-10 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Com pendências</p>
                      <p className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-1">{arrivalsTodayKPIs.withIssues}</p>
                    </div>
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Arrivals List */}
            {arrivalsTodayLoading ? (
              <Card className="border-none shadow-lg rounded-2xl">
                <CardContent className="p-8 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : arrivalsToday.length === 0 ? (
              <Card className="border-none shadow-lg rounded-2xl border-dashed">
                <CardContent className="p-8">
                  <EmptyState
                    icon={Calendar}
                    title="Nenhuma reserva encontrada"
                    description="Para começar a operar, crie sua primeira reserva em poucos segundos."
                    primaryAction={!isViewer ? {
                      label: "Criar reserva rápida",
                      onClick: () => setIsQuickBookingOpen(true)
                    } : undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-lg rounded-2xl">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <LogIn className="h-4 w-4 text-emerald-600" />
                    </div>
                    Fila de Chegadas ({arrivalsToday.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {arrivalsToday.map((booking) => {
                      const hasGroup = bookingGroups.some(g => g.booking_id === booking.id);
                      const precheckinCount = precheckinSessions.filter(s => s.booking_id === booking.id).length;
                      const participantCount = bookingGuests.filter(g => g.booking_id === booking.id).length;
                      const readiness = arrivalsTodayReadiness[booking.id];

                      // Helper: Get readiness badge variant and label
                      const getReadinessBadge = (status: 'READY' | 'WARNING' | 'BLOCKED') => {
                        switch (status) {
                          case 'READY':
                            return { variant: 'default' as const, label: 'Pronto', className: 'bg-emerald-500 text-white' };
                          case 'WARNING':
                            return { variant: 'secondary' as const, label: 'Pendência', className: 'bg-amber-500 text-white' };
                          case 'BLOCKED':
                            return { variant: 'destructive' as const, label: 'Bloqueado', className: 'bg-red-600 text-white' };
                        }
                      };

                      // Helper: Get reason chip label
                      const getReasonLabel = (reason: 'ROOM' | 'PRIMARY_GUEST' | 'PRECHECKIN') => {
                        switch (reason) {
                          case 'ROOM': return 'Sem quarto';
                          case 'PRIMARY_GUEST': return 'Sem hóspede principal';
                          case 'PRECHECKIN': return 'Pré-check-in pendente';
                        }
                      };

                      const badge = readiness ? getReadinessBadge(readiness.status) : null;

                      return (
                        <div key={booking.id} className="space-y-2">
                          {/* Readiness Badge + Reason Chips */}
                          {readiness && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={badge?.className}>
                                {badge?.label}
                              </Badge>
                              {readiness.reasons.length > 0 && readiness.reasons.map((reason, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {getReasonLabel(reason)}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Booking Card */}
                          <FrontDeskBookingCard
                            booking={booking}
                            onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
                            alerts={alertStates[booking.id]}
                            hasGroup={hasGroup}
                            precheckinCount={precheckinCount}
                            participantCount={participantCount}
                          />

                          {/* Task 3: Guided Check-in Button */}
                          {!isViewer && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCheckinBookingId(booking.id)}
                              className="w-full"
                            >
                              <LogIn className="h-3 w-3 mr-2" />
                              Ver check-in
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sections: Arrivals, Departures, In-House */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BookingSection
              title="Chegadas (Hoje)"
              icon={LogIn}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              bookings={filteredArrivals}
              isLoading={arrivalsLoading}
              onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
              alertStates={alertStates}
            />

            <BookingSection
              title="Saídas (Hoje)"
              icon={LogOut}
              iconColor="text-rose-600"
              bgColor="bg-rose-50"
              bookings={filteredDepartures}
              isLoading={departuresLoading}
              onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
              alertStates={alertStates}
            />

            <BookingSection
              title="Em Casa"
              icon={BedDouble}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
              bookings={filteredInHouse}
              isLoading={inHouseLoading}
              onOpenFolio={(id) => navigate(`/operation/folio/${id}`)}
              alertStates={alertStates}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Quick Booking Dialog */}
      <QuickBookingDialog open={isQuickBookingOpen} onOpenChange={setIsQuickBookingOpen} />

      {/* ===== SPRINT 5.5 TASK 3: GUIDED CHECK-IN PANEL (DRAWER/SHEET) ===== */}
      <Sheet open={!!selectedCheckinBookingId} onOpenChange={(open) => !open && setSelectedCheckinBookingId(null)}>
        <SheetContent className="sm:max-w-xl p-0 overflow-y-auto">
          {selectedCheckinBookingId && (
            <GuidedCheckinPanel
              bookingId={selectedCheckinBookingId}
              onClose={() => setSelectedCheckinBookingId(null)}
              onCheckinSuccess={() => {
                setSelectedCheckinBookingId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
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
  alertStates: Record<string, { precheckinPending: boolean; noPrimaryGuest: boolean; arrivalNoCheckin: boolean }>;
  searchQuery?: string;
}

const BookingSection = ({ title, icon: Icon, iconColor, bgColor, bookings, isLoading, onOpenFolio, alertStates, searchQuery }: BookingSectionProps) => {
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
            {searchQuery ? (
              <EmptyState
                icon={Search}
                title="Nenhum resultado"
                description="Tente mudar o filtro."
              />
            ) : (
              <>
                <div className={`h-12 w-12 rounded-full ${bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhuma reserva
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {bookings.map((booking) => {
              const hasGroup = bookingGroups.some(g => g.booking_id === booking.id);
              const precheckinCount = precheckinSessions.filter(s => s.booking_id === booking.id).length;
              const participantCount = bookingGuests.filter(g => g.booking_id === booking.id).length;

              return (
                <FrontDeskBookingCard
                  key={booking.id}
                  booking={booking}
                  onOpenFolio={onOpenFolio}
                  alerts={alertStates[booking.id]}
                  hasGroup={hasGroup}
                  precheckinCount={precheckinCount}
                  participantCount={participantCount}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FrontDeskPage;
