import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useArrivals } from "@/hooks/useArrivals";
import { useFrontDesk } from "@/hooks/useFrontDesk";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, LogIn, Calendar, Building2, User, Home } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge } from "@/lib/ui-helpers";

const ArrivalsPage = () => {
    const { properties, isLoading: propertiesLoading } = useProperties();
    const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
    const { arrivals, isLoading: arrivalsLoading } = useArrivals(selectedPropertyId);
    const { checkIn, allocatedRooms } = useFrontDesk(selectedPropertyId);

    const isLoading = propertiesLoading || arrivalsLoading || propertyStateLoading;

    const handleCheckIn = async (bookingId: string, roomId: string) => {
        await checkIn({ bookingId, roomId });
    };

    if (propertyStateLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                </div>
            </DashboardLayout>
        );
    }

    if (!selectedPropertyId) {
        return (
            <DashboardLayout>
                <Card className="border-dashed mt-8">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-4">
                            Selecione uma propriedade no menu para ver as chegadas de hoje.
                        </p>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Chegadas de Hoje</h1>
                        <p className="text-muted-foreground mt-1">
                            Lista de hóspedes com check-in previsto para hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}.
                        </p>
                    </div>
                    <Select
                        value={selectedPropertyId}
                        onValueChange={setSelectedPropertyId}
                        disabled={propertiesLoading || properties.length === 0}
                    >
                        <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Selecione uma propriedade" />
                        </SelectTrigger>
                        <SelectContent>
                            {properties.map((prop) => (
                                <SelectItem key={prop.id} value={prop.id}>
                                    {prop.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground mt-2">Carregando chegadas...</p>
                        </div>
                    ) : arrivals.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Nenhuma chegada para hoje</h3>
                                <p className="text-muted-foreground">Não há check-ins previstos para esta propriedade hoje.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        arrivals.map((arrival) => {
                            // Find available rooms for this room type
                            const availableRooms = allocatedRooms.filter(
                                (r) => r.room_type_id === arrival.room_type_id && r.status === 'available'
                            );

                            return (
                                <Card key={arrival.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{arrival.guest_name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            {getStatusBadge(arrival.status as any)}
                                                            <span>•</span>
                                                            <span>Reserva #{arrival.id.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{arrival.room_types?.name || 'Tipo não definido'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span>Check-out: {format(parseISO(arrival.check_out), "dd/MM/yyyy")}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                                                <div className="text-right mb-2">
                                                    <p className="text-sm text-muted-foreground">Valor Total</p>
                                                    <p className="text-xl font-bold text-success">
                                                        R$ {arrival.total_amount?.toFixed(2)}
                                                    </p>
                                                </div>

                                                {availableRooms.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <Select onValueChange={(roomId) => handleCheckIn(arrival.id, roomId)}>
                                                            <SelectTrigger className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                                                <LogIn className="h-4 w-4 mr-2" />
                                                                <SelectValue placeholder="Realizar Check-in" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableRooms.map((room) => (
                                                                    <SelectItem key={room.id} value={room.id}>
                                                                        Quarto {room.room_number}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-[10px] text-center text-muted-foreground">
                                                            {availableRooms.length} quartos disponíveis deste tipo
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" disabled className="w-full">
                                                        Sem quartos disponíveis
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ArrivalsPage;
