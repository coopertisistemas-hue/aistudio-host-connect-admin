import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useShifts } from "@/hooks/useShifts";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { OperationPageTemplate } from "@/components/OperationPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Clock,
    MapPin,
    Users,
    StickyNote,
    Send,
    AlertCircle,
    CheckCircle2,
    Calendar
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const MyShiftsPage = () => {
    const { user } = useAuth();
    const { selectedPropertyId } = useSelectedProperty();
    const { shifts, isLoading, addHandoff } = useShifts(selectedPropertyId!);

    const [note, setNote] = useState("");

    // Find user's shift for today
    const myTodayShifts = shifts.filter(s =>
        isSameDay(new Date(s.start_at), new Date()) &&
        s.shift_assignments?.some((as: any) => as.staff_profiles?.user_id === user?.id)
    );

    const currentShift = myTodayShifts.find(s => s.status === 'active') || myTodayShifts[0];

    if (isLoading) return <DataTableSkeleton />;

    return (
        <OperationPageTemplate
            title="Meu Turno"
            subtitle="Acompanhamento e tarefas do plantão"
            headerIcon={<Calendar className="h-6 w-6 text-primary" />}
        >
            {!currentShift ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-2xl border border-dashed">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                    <p className="font-bold text-muted-foreground">Nenhum turno escalado para hoje.</p>
                    <p className="text-xs text-muted-foreground mt-1">Consulte o gestor se houver dúvidas.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Shift Card */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-transparent">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <Badge variant={currentShift.status === 'active' ? "success" : "secondary"} className="uppercase font-bold">
                                    {currentShift.status === 'active' ? 'Em Andamento' : 'Planejado'}
                                </Badge>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(currentShift.start_at), "HH:mm")} - {format(new Date(currentShift.end_at), "HH:mm")}
                                </div>
                            </div>
                            <CardTitle className="text-xl mt-2">{currentShift.departments?.name || "Turno Geral"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>Unidade Principal</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Equipe: {currentShift.shift_assignments?.map((as: any) => as.staff_profiles?.name).join(", ")}</span>
                                </div>
                            </div>

                            {currentShift.status === 'planned' && (
                                <Button className="w-full h-12 text-base font-bold gap-2">
                                    <CheckCircle2 className="h-5 w-5" /> Confirmar Presença
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Handoff Section */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <StickyNote className="h-4 w-4 text-primary" />
                            Passagem de Bastão (Handoff)
                        </h3>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Adicionar observação importante..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="bg-card"
                            />
                            <Button
                                size="icon"
                                onClick={() => {
                                    if (!note) return;
                                    addHandoff.mutate({ shift_id: currentShift.id, text: note, tags: [] });
                                    setNote("");
                                }}
                                disabled={addHandoff.isPending}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden bg-card">
                            <CardContent className="p-0">
                                <div className="divide-y divide-dashed">
                                    {/* Mock for now as useShifts doesn't return handoffs nested yet */}
                                    <div className="p-4 flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-[8px] font-bold border border-primary/10">S</div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold">Sistema de Alerta</p>
                                            <p className="text-[10px] text-muted-foreground">Dê as boas vindas ao novo turno registrando as novidades do dia aqui.</p>
                                            <p className="text-[8px] text-muted-foreground pt-1">{format(new Date(), "HH:mm")}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </OperationPageTemplate>
    );
};

export default MyShiftsPage;
