import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useGuests } from "@/hooks/useGuests";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GuestDialog from "@/components/GuestDialog";
import { Search, Mail, Phone, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const Guests = () => {
  const { guests, isLoading, totalGuests } = useGuests();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<typeof guests[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = guests.reduce((sum, guest) => sum + guest.totalSpent, 0);
  const averageBookingsPerGuest = totalGuests > 0 ? guests.reduce((sum, g) => sum + g.totalBookings, 0) / totalGuests : 0;

  const handleGuestClick = (guest: typeof guests[0]) => {
    setSelectedGuest(guest);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Hóspedes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus hóspedes e visualize histórico de reservas
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total de Hóspedes</span>
            </div>
            <p className="text-3xl font-bold">{totalGuests}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Receita Total</span>
            </div>
            <p className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Média Reservas/Hóspede</span>
            </div>
            <p className="text-3xl font-bold">{averageBookingsPerGuest.toFixed(1)}</p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar hóspede por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Guest List */}
        {isLoading ? (
          <DataTableSkeleton />
        ) : filteredGuests.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum hóspede encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Tente buscar com termos diferentes"
                  : "Seus hóspedes aparecerão aqui quando você criar reservas"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuests.map((guest) => (
              <Card
                key={guest.email}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleGuestClick(guest)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{guest.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Última visita: {format(new Date(guest.lastVisit), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="secondary">{guest.totalBookings} reservas</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Total gasto</p>
                  <p className="text-xl font-bold">R$ {guest.totalSpent.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <GuestDialog
        guest={selectedGuest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </DashboardLayout>
  );
};

export default Guests;