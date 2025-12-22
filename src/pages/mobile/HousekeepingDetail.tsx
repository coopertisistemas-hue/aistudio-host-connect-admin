import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Bed,
    Brush,
    Plus,
    Minus,
    AlertTriangle,
    ChevronLeft,
    CheckCircle2,
    X,
    ClipboardList,
    Camera,
    MessageSquare
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow,
    PrimaryBottomCTA
} from "@/components/mobile/MobileUI";
import { useHousekeeping } from "@/hooks/useHousekeeping";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HousekeepingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { tasks, updateTaskStatus, addConsumption, openMaintenance } = useHousekeeping(selectedPropertyId);

    const [maintenanceOpen, setMaintenanceOpen] = useState(false);
    const [maintenanceNotes, setMaintenanceNotes] = useState("");
    const [notes, setNotes] = useState("");
    const [consumption, setConsumption] = useState<{ id: string; name: string; qty: number; price: number }[]>([
        { id: "1", name: "Água sem gás", qty: 0, price: 5 },
        { id: "2", name: "Cerveja Lata", qty: 0, price: 12 },
        { id: "3", name: "Refrigerante", qty: 0, price: 8 },
        { id: "4", name: "Kit Amenities Premium", qty: 0, price: 25 },
    ]);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return (
            <MobileShell header={<MobilePageHeader title="Tarefa não encontrada" />}>
                <div className="p-10 text-center">
                    <p className="text-neutral-500">Essa tarefa pode ter sido removida ou você não tem acesso.</p>
                </div>
            </MobileShell>
        );
    }

    const handleUpdateQty = (itemId: string, delta: number) => {
        setConsumption(prev => prev.map(item =>
            item.id === itemId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        ));
    };

    const handleWorkflowAction = () => {
        if (task.status === 'pending') {
            updateTaskStatus.mutate({ taskId: task.id, roomId: task.room_id, status: 'cleaning' });
        } else if (task.status === 'cleaning') {
            // If we have consumption, register it before completing
            const itemsToCharge = consumption.filter(i => i.qty > 0).map(i => ({
                name: i.name,
                quantity: i.qty,
                price: i.price
            }));

            if (itemsToCharge.length > 0 && task.reservation_id) {
                addConsumption.mutate({ reservationId: task.reservation_id, items: itemsToCharge });
            }

            updateTaskStatus.mutate({ taskId: task.id, roomId: task.room_id, status: 'completed', notes });
            navigate('/m/housekeeping');
        }
    };

    const handleOpenMaintenance = () => {
        openMaintenance.mutate({
            roomId: task.room_id,
            propertyId: selectedPropertyId!,
            description: maintenanceNotes
        });
        setMaintenanceOpen(false);
        updateTaskStatus.mutate({ taskId: task.id, roomId: task.room_id, status: 'maintenance_required' });
        navigate('/m/housekeeping');
    };

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title={`Quarto ${task.room?.room_number}`}
                    subtitle={task.room?.name}
                />
            }
        >
            <div className="px-5 pb-32">
                {/* Reservation Info Card */}
                <SectionTitleRow title="Reserva & Hóspede" />
                <CardContainer className="bg-white border-none shadow-sm p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-[15px] font-bold text-[#1A1C1E]">{task.reservation?.guest_name || "Sem hóspede"}</h4>
                            <p className="text-xs text-neutral-400">Checkout previsto: {task.reservation ? format(new Date(task.reservation.check_out), 'dd/MM/yyyy') : "N/A"}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    {task.notes && (
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 mt-2">
                            <p className="text-[11px] text-neutral-500 font-medium uppercase mb-1">Nota da Recepção</p>
                            <p className="text-xs text-neutral-600 italic">"{task.notes}"</p>
                        </div>
                    )}
                </CardContainer>

                {/* Minibar Consumption */}
                {task.status === 'cleaning' && (
                    <>
                        <SectionTitleRow title="Consumo do Frigobar" />
                        <CardContainer className="border-none shadow-sm divide-y" noPadding>
                            {consumption.map((item) => (
                                <div key={item.id} className="p-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#1A1C1E]">{item.name}</span>
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">R$ {item.price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg"
                                            onClick={() => handleUpdateQty(item.id, -1)}
                                            disabled={item.qty === 0}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center text-sm font-bold">{item.qty}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg"
                                            onClick={() => handleUpdateQty(item.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContainer>
                    </>
                )}

                {/* Notes Section */}
                <SectionTitleRow title="Observações da Limpeza" />
                <CardContainer className="p-4 border-none shadow-sm">
                    <Textarea
                        placeholder="Ex: Encontrei objeto deixado pelo hóspede, falta toalha de rosto..."
                        className="bg-neutral-50 border-none min-h-[100px] text-sm focus-visible:ring-primary/20"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold gap-2">
                            <Camera className="h-4 w-4" /> FOTO EVIDÊNCIA
                        </Button>
                    </div>
                </CardContainer>

                {/* Maintenance Action */}
                <div className="mt-8">
                    <Button
                        variant="ghost"
                        className="w-full h-14 rounded-2xl bg-orange-50 text-orange-600 font-bold gap-2 border border-orange-100"
                        onClick={() => setMaintenanceOpen(true)}
                    >
                        <AlertTriangle className="h-5 w-5" /> Abrir Chamado de Manutenção
                    </Button>
                </div>
            </div>

            {/* Primary Workflow CTA */}
            <PrimaryBottomCTA
                label={task.status === 'pending' ? "INICIAR LIMPEZA" : "LIBERAR QUARTO"}
                onClick={handleWorkflowAction}
                loading={updateTaskStatus.isPending}
            />

            {/* Maintenance Dialog */}
            <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                <DialogContent className="w-[90vw] rounded-[22px] p-6 top-[20%] translate-y-0">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Solicitar Manutenção</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-neutral-500">Descreva o problema identificado no quarto {task.room?.room_number}.</p>
                        <Textarea
                            placeholder="Ex: Ar condicionado pingando, lâmpada queimada..."
                            className="bg-neutral-50 border-none min-h-[100px]"
                            value={maintenanceNotes}
                            onChange={(e) => setMaintenanceNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="flex-row gap-2 pt-0 sm:justify-center">
                        <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setMaintenanceOpen(false)}>Cancelar</Button>
                        <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleOpenMaintenance} disabled={!maintenanceNotes.trim()}>Enviar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MobileShell>
    );
};

export default HousekeepingDetail;
