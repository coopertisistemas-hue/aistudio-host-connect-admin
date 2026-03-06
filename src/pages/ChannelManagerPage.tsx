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
import { useOtaSync, SyncOtaInput, SyncOtaResponse } from "@/hooks/useOtaSync";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { Loader2, Globe, CalendarIcon, CheckCircle2, XCircle, Home, AlertTriangle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";

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
  const [maxAttempts, setMaxAttempts] = useState<number>(2);
  const [syncResults, setSyncResults] = useState<SyncOtaResponse | null>(null);

  useEffect(() => {
    if (roomTypes.length > 0 && !roomTypeId) {
      setRoomTypeId(roomTypes[0].id);
    }
  }, [roomTypes, roomTypeId]);

  const otaKeys = websiteSettings.filter((s) => s.setting_key.includes("_api_key") && s.setting_key !== "google_business_api_key" && s.setting_key !== "facebook_app_secret");
  const isOtaConfigured = otaKeys.some((k) => k.setting_value);

  const handleSync = async () => {
    if (!selectedPropertyId || !roomTypeId || !date || (price === undefined && availability === undefined)) {
      toast({
        title: "Erro de preenchimento",
        description: "Selecione propriedade, tipo, data e informe preco ou disponibilidade.",
        variant: "destructive",
      });
      return;
    }

    if (!isOtaConfigured) {
      toast({
        title: "OTAs nao configuradas",
        description: "Configure as chaves de API OTA em Configuracoes do Site.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: SyncOtaInput = {
        property_id: selectedPropertyId,
        room_type_id: roomTypeId,
        date: format(date, "yyyy-MM-dd"),
        max_attempts: maxAttempts,
      };

      if (price !== undefined) payload.price = price;
      if (availability !== undefined) payload.availability = availability;

      const response = await syncInventory.mutateAsync(payload);
      setSyncResults(response);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const isDataLoading = propertiesLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciador de Canais (Channel Manager)</h1>
            <p className="text-muted-foreground mt-1">Sincronize precos e disponibilidade com OTAs (Booking, Airbnb, Expedia).</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione a Propriedade</CardTitle>
            <CardDescription>Escolha a propriedade para gerenciar a sincronizacao de canais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId} disabled={isDataLoading || properties.length === 0}>
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
              <p className="text-muted-foreground text-center max-w-md mb-4">Selecione uma propriedade acima para gerenciar seus canais.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Status da Configuracao OTA
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["booking_com_api_key", "airbnb_api_key", "expedia_api_key"].map((key) => {
                  const isKeySet = websiteSettings.some((s) => s.setting_key === key && s.setting_value);
                  const name = key.split("_")[0].toUpperCase();
                  return (
                    <div key={key} className={cn("flex items-center gap-2 p-3 rounded-md border", isKeySet ? "border-success bg-success/10" : "border-destructive bg-destructive/10")}>
                      {isKeySet ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
                      <p className="text-sm font-medium">{name}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sincronizacao Manual</CardTitle>
                <CardDescription>Envie atualizacoes de preco/disponibilidade com retries controlados por contrato SP10.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room_type_id">Tipo de Acomodacao *</Label>
                    <Select value={roomTypeId} onValueChange={setRoomTypeId} disabled={roomTypesLoading || roomTypes.length === 0 || syncInventory.isPending}>
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

                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")} disabled={syncInventory.isPending}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Preco por Noite (R$)</Label>
                    <Input id="price" type="number" step="0.01" placeholder="Ex: 150.00" value={price === undefined ? "" : price} onChange={(e) => setPrice(e.target.value === "" ? undefined : Number(e.target.value))} disabled={syncInventory.isPending} />
                    <p className="text-xs text-muted-foreground">Deixe em branco para nao atualizar o preco.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilidade (Quartos)</Label>
                    <Input id="availability" type="number" min="0" placeholder="Ex: 5" value={availability === undefined ? "" : availability} onChange={(e) => setAvailability(e.target.value === "" ? undefined : Number(e.target.value))} disabled={syncInventory.isPending} />
                    <p className="text-xs text-muted-foreground">Deixe em branco para nao atualizar a disponibilidade.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_attempts">Tentativas Maximas</Label>
                    <Select value={String(maxAttempts)} onValueChange={(value) => setMaxAttempts(Number(value))} disabled={syncInventory.isPending}>
                      <SelectTrigger id="max_attempts">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 tentativa</SelectItem>
                        <SelectItem value="2">2 tentativas</SelectItem>
                        <SelectItem value="3">3 tentativas</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Definido no contrato SP10 (1 a 3).</p>
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

            {syncResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados da Ultima Sincronizacao</CardTitle>
                  <CardDescription>
                    Trace: <span className="font-mono text-xs">{syncResults.trace_id}</span> | Sucesso {syncResults.summary.success}/{syncResults.summary.total}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {syncResults.results.map((result) => (
                    <div key={result.ota} className="flex items-center gap-2 text-sm">
                      {result.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : result.retryable ? (
                        <RefreshCcw className="h-4 w-4 text-amber-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium capitalize">{result.ota.replace("_", " ")}:</span>
                      <span className="text-muted-foreground">
                        {result.message} (code={result.code}, attempts={result.attempts})
                      </span>
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
