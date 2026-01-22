import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Calendar as CalendarIcon,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Edit,
  Trash2,
  Users,
  DollarSign,
  List,
  CalendarDays,
  ConciergeBell, // Importar ícone para serviços
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import BookingDialog from "@/components/BookingDialog";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";
import { useBookings, Booking, BookingInput } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth
import { getStatusBadge } from "@/lib/ui-helpers";
import BookingCalendar from "@/components/BookingCalendar";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const Bookings = () => {
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';
  const { bookings, isLoading, createBooking, updateBooking, deleteBooking } = useBookings();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list"); // New state for view mode

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.properties?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.service_details && booking.service_details.some(service => service.name.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateBooking = () => {
    if (isViewer) return;
    setSelectedBooking(null);
    setDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    if (isViewer) return;
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: BookingInput) => {
    if (isViewer) return;
    if (selectedBooking) {
      await updateBooking.mutateAsync({ id: selectedBooking.id, booking: data });
    } else {
      await createBooking.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    if (isViewer) return;
    setBookingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isViewer) return;
    if (bookingToDelete) {
      await deleteBooking.mutateAsync(bookingToDelete);
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Sprint 6.0: Onboarding Banner */}
        <OnboardingBanner />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reservas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as reservas das suas propriedades
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            {!isViewer && (
              <Button variant="hero" onClick={handleCreateBooking}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Reserva
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por hóspede, propriedade ou serviço..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Content */}
        {isLoading ? (
          <DataTableSkeleton />
        ) : filteredBookings.length === 0 && (searchQuery || statusFilter !== "all") ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma reserva encontrada
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Tente ajustar seus filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === "list" ? (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-medium transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{booking.guest_name}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(booking.status as any)}
                            {booking.properties && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {booking.properties.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Check-in</p>
                          <p className="font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(booking.check_in), "dd MMM yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Check-out</p>
                          <p className="font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(booking.check_out), "dd MMM yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Hóspedes</p>
                          <p className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {booking.total_guests}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Valor Total</p>
                          <p className="font-medium flex items-center gap-2 text-success">
                            <DollarSign className="h-4 w-4" />
                            R$ {booking.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {booking.service_details && booking.service_details.length > 0 && (
                        <div className="space-y-2 text-sm pt-2 border-t">
                          <p className="text-muted-foreground flex items-center gap-2">
                            <ConciergeBell className="h-4 w-4" />
                            Serviços Adicionais:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {booking.service_details.map(service => (
                              <Badge key={service.id} variant="outline">
                                {service.name} (R$ {service.price.toFixed(2)}{service.is_per_person ? '/pessoa' : ''}{service.is_per_day ? '/dia' : ''})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-sm pt-2 border-t">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{booking.guest_email}</span>
                        </div>
                        {booking.guest_phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{booking.guest_phone}</span>
                          </div>
                        )}
                        {booking.notes && (
                          <CardDescription className="mt-2">
                            <strong>Obs:</strong> {booking.notes}
                          </CardDescription>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditBooking(booking)}
                          disabled={isViewer}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {isViewer ? "Ver Detalhes" : "Editar"}
                        </Button>
                        {!isViewer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <BookingCalendar bookings={filteredBookings} onSelectBooking={handleEditBooking} />
            )}
          </>
        )}
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        booking={selectedBooking}
        onSubmit={handleSubmit}
        isLoading={createBooking.isPending || updateBooking.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Bookings;