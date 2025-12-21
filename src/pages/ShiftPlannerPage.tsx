import { useState } from "react";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useShifts } from "@/hooks/useShifts";
import { useStaff } from "@/hooks/useStaff";
import { OperationPageTemplate } from "@/components/OperationPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Filter
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ShiftPlannerPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { shifts, isLoading: shiftsLoading, updateShiftStatus } = useShifts(selectedPropertyId!);
    const { departments, isLoading: staffLoading } = useStaff(selectedPropertyId!);

    const [currentDate, setCurrentDate] = useState(new Date());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

    if (shiftsLoading || staffLoading) return <DataTableSkeleton />;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-success text-white';
            case 'closed': return 'bg-muted text-muted-foreground';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    return (
        <OperationPageTemplate
            title="Gestão de Turnos"
            subtitle="Planejamento e escala da equipe"
            headerIcon={<CalendarIcon className="h-6 w-6 text-primary" />}
        >
            <div className="flex flex-col gap-6">
                {/* Weekly Header Navigator */}
                <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="font-bold text-sm min-w-[150px] text-center capitalize">
                            {format(weekStart, "dd MMM", { locale: ptBR })} - {format(weekDays[6], "dd MMM", { locale: ptBR })}
                        </h3>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="h-4 w-4" /> Filtros
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Novo Turno
                        </Button>
                    </div>
                </div>

                {/* Weekly Matrix / List */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {weekDays.map((day) => {
                        const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_at), day));
                        return (
                            <div key={day.toString()} className="space-y-3">
                                <div className={isSameDay(day, new Date()) ? "text-primary" : ""}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {format(day, "eee", { locale: ptBR })}
                                    </p>
                                    <p className="text-lg font-bold">{format(day, "dd")}</p>
                                </div>

                                <div className="space-y-2">
                                    {dayShifts.map((shift) => (
                                        <Card key={shift.id} className="overflow-hidden border-none shadow-sm bg-card hover:ring-1 ring-primary/20 transition-all cursor-pointer">
                                            <div className={`h-1 ${getStatusColor(shift.status).split(' ')[0]}`} />
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[10px] font-bold text-primary truncate max-w-[80px]">
                                                        {shift.departments?.name || "Geral"}
                                                    </p>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-5 w-5 -mt-1 -mr-1">
                                                                <MoreHorizontal className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                                            {shift.status === 'planned' && (
                                                                <DropdownMenuItem onClick={() => updateShiftStatus.mutate({ id: shift.id, status: 'active' })}>
                                                                    Iniciar Turno
                                                                </DropdownMenuItem>
                                                            )}
                                                            {shift.status === 'active' && (
                                                                <DropdownMenuItem onClick={() => updateShiftStatus.mutate({ id: shift.id, status: 'closed' })}>
                                                                    Fechar Turno
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(shift.start_at), "HH:mm")} - {format(new Date(shift.end_at), "HH:mm")}
                                                </div>

                                                <div className="flex -space-x-2 overflow-hidden py-1">
                                                    {shift.shift_assignments?.map((as: any) => (
                                                        <div
                                                            key={as.id}
                                                            className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold"
                                                            title={as.staff_profiles?.name}
                                                        >
                                                            {as.staff_profiles?.name?.[0]}
                                                        </div>
                                                    ))}
                                                    {(!shift.shift_assignments || shift.shift_assignments.length === 0) && (
                                                        <div className="text-[8px] text-destructive font-bold pt-1">EQUIPE VAZIA</div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button variant="ghost" className="w-full border-dashed border h-auto py-2 group hover:bg-primary/5">
                                        <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </OperationPageTemplate>
    );
};

export default ShiftPlannerPage;
