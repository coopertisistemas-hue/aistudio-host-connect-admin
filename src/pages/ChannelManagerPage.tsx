import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProperties } from "@/hooks/useProperties";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useOtaSync } from "@/hooks/useOtaSync";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { Loader2, Globe, CalendarIcon, DollarSign, BedDouble, CheckCircle2, XCircle, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT

const ChannelManagerPage = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  
  const { roomTypes, isLoading: roomTypesLoading } = useRoomTypes(selectedPropertyId);
  const { settings: websiteSettings } = useWebsiteSettings(selectedPropertyId);
  const { syncInventory } = useOtaSync();
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [availability, setAvailability] = useState<number | undefined>(undefined);
  const [syncResults, setSyncResults] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (roomTypes.length > 0 && !roomTypeId) {
      setRoomTypeId(roomTypes[0].id);
    }
  }, [roomTypes, roomTypeId]);

  const otaKeys = websiteSettings.filter(s => s.setting_key.includes('_api_key') && s.setting_key !== 'google_business_api_key' && s.setting_key !== 'facebook_app_secret');
  const isOtaConfigured = otaKeys.some(k => k.setting_value);

  const handleSync = async () => {
    if (!selectedPropertyId || !roomTypeId || !date || (price === undefined && availability === undefined)) {
      toast({
        title: "Erro de Preenchimento",
        description: "Selecione a propriedade, o tipo de acomodação, a data e forneça o preço ou a disponibilidade.",
        variant: "destructive",
      });
      return;
    }

    if (!isOtaConfigured) {
      toast({
        title: "OTAs Não Configurados",
        description: "Configure as chaves de API das OTAs na página de Configurações do Site.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data: any = {
        property_id: selectedPropertyId,
        room_type_id: roomTypeId,
        date: format(date, 'yyyy-MM-dd'),
      };
      if (price !== undefined) data.price = price;
      if (availability !== undefined) data.availability = availability;

      const response = await syncInventory.mutateAsync(data);
      setSyncResults(response.results);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const isDataLoading = propertiesLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciador de Canais (Channel Manager)</h1>
            <p className="text-muted-foreground mt-1">
              Sincronize preços e disponibilidade com OTAs (Booking, Airbnb, Expedia).
            </p>
          </div>
        </div>

        {/* Property Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Propriedade</CardTitle>
            <CardDescription>Escolha a propriedade para gerenciar a sincronização de canais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
              disabled={isDataLoading || properties.length === 0}
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
          </CardContent>
        </Card>

        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para gerenciar seus canais.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Configuration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Status da Configuração OTA
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['booking_com_api_key', 'airbnb_api_key', 'expedia_api_key'].map(key => {
                  const isKeySet = websiteSettings.some(s => s.setting_key === key && s.setting_value);
                  const name = key.split('_')[0].toUpperCase();
                  return (
                    <div key={key} className={cn("flex items-center gap-2 p-3 rounded-md border", isKeySet ? "border-success bg-success/10" : "border-destructive bg-destructive/10")}>
                      {isKeySet ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
                      <p className="text-sm font-medium">{name}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Sync Form */}
            <Card>
              <CardHeader>
                <CardTitle>Sincronização Manual</CardTitle>
                <CardDescription>Selecione os parâmetros para enviar atualizações de preço ou disponibilidade para as OTAs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Room Type Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="room_type_id">Tipo de Acomodação *</Label>
                    <Select
                      value={roomTypeId}
                      onValueChange={setRoomTypeId}
                      disabled={roomTypesLoading || roomTypes.length === 0 || syncInventory.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={rt.id}>
                            {rt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                          disabled={syncInventory.isPending}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Price Input */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço por Noite (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 150.00"
                      value={price === undefined ? '' : price}
                      onChange={(e) => setPrice(e.target.value === '' ? undefined : Number(e.target.value))}
                      disabled={syncInventory.isPending}
                    />
                    <p className="text-xs text-muted-foreground">Deixe em branco para não atualizar o preço.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Availability Input */}
                  <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilidade (Quartos)</Label>
                    <Input
                      id="availability"
                      type="number"
                      min="0"
                      placeholder="Ex: 5"
                      value={availability === undefined ? '' : availability}
                      onChange={(e) => setAvailability(e.target.value === '' ? undefined : Number(e.target.value))}
                      disabled={syncInventory.isPending}
                    />
                    <p className="text-xs text-muted-foreground">Deixe em branco para não atualizar a disponibilidade.</p>
                  </div>
                </div>

                <Button
                  onClick={handleSync}
                  disabled={syncInventory.isPending || !selectedPropertyId || !roomTypeId || !date || (price === undefined && availability === undefined)}
                  variant="hero"
                  className="w-full md:w-auto"
                >
                  {syncInventory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sincronizar com OTAs
                </Button>
              </CardContent>
            </Card>

            {/* Sync Results */}
            {syncResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados da Última Sincronização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(syncResults).map(([ota, message]) => (
                    <div key={ota} className="flex items-center gap-2 text-sm">
                      {message.includes('Sucesso') || message.includes('Sincronização simulada') ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium capitalize">{ota.replace('_api_key', '').replace('_', ' ')}:</span>
                      <span className="text-muted-foreground">{message}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChannelManagerPage;