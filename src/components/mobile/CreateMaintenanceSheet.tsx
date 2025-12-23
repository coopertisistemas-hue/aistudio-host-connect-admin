import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, Plus, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CreateMaintenanceSheetProps {
    children?: React.ReactNode;
    defaultRoomId?: string;
}

export const CreateMaintenanceSheet: React.FC<CreateMaintenanceSheetProps> = ({ children, defaultRoomId }) => {
    const [open, setOpen] = useState(false);
    const { selectedPropertyId } = useSelectedProperty();
    const { createTicket } = useMaintenance(selectedPropertyId);
    const { user } = useAuth(); // To get current user ID

    const [roomId, setRoomId] = useState(defaultRoomId || "");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [assignToMe, setAssignToMe] = useState(true);

    // Fetch rooms for selection
    const { data: rooms = [] } = useQuery({
        queryKey: ['rooms-simple', selectedPropertyId],
        queryFn: async () => {
            if (!selectedPropertyId) return [];
            const { data, error } = await supabase
                .from('rooms')
                .select('id, room_number')
                .eq('property_id', selectedPropertyId)
                .order('room_number');
            if (error) throw error;
            return data;
        },
        enabled: !!selectedPropertyId && open
    });

    const handleSubmit = async () => {
        if (!roomId || !title) return;

        await createTicket.mutateAsync({
            roomId,
            title,
            description,
            priority,
            assignedTo: assignToMe && user ? user.id : undefined
        });

        setOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setPriority("medium");
        setAssignToMe(true);
        if (!defaultRoomId) setRoomId("");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button className="h-14 w-14 rounded-full shadow-xl bg-neutral-900 hover:bg-neutral-800 text-white p-0 flex items-center justify-center fixed bottom-6 right-6 z-50 active:scale-90 transition-all">
                        <Plus className="h-6 w-6" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[32px] min-h-[70vh] p-0 border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="px-6 pt-8 pb-6">
                    <SheetHeader className="mb-6 text-left">
                        <SheetTitle className="text-2xl font-black text-neutral-800">Novo Chamado</SheetTitle>
                        <SheetDescription className="text-neutral-500 font-medium">
                            Registre uma ocorrência ou manutenção.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-neutral-400 tracking-wider ml-1">Local</Label>
                            <Select value={roomId} onValueChange={setRoomId} disabled={!!defaultRoomId}>
                                <SelectTrigger className="h-12 rounded-2xl bg-neutral-50 border-neutral-200 focus:ring-0 focus:border-neutral-400 font-bold text-neutral-700">
                                    <SelectValue placeholder="Selecione o local" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map(room => (
                                        <SelectItem key={room.id} value={room.id} className="font-medium text-neutral-600">
                                            {room.room_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-neutral-400 tracking-wider ml-1">Título</Label>
                            <Input
                                placeholder="Ex: Torneira vazando"
                                className="h-12 rounded-2xl bg-neutral-50 border-neutral-200 font-bold text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 transition-all"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-neutral-400 tracking-wider ml-1">Prioridade</Label>
                            <div className="flex gap-2 p-1 bg-neutral-50 rounded-xl border border-neutral-100">
                                {(['low', 'medium', 'high'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 h-10 rounded-lg text-xs font-bold uppercase transition-all ${priority === p
                                            ? 'bg-white text-neutral-800 shadow-sm border border-neutral-100 transform scale-[1.02]'
                                            : 'text-neutral-400 hover:text-neutral-600'
                                            }`}
                                    >
                                        {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-neutral-400 tracking-wider ml-1">Descrição</Label>
                            <Textarea
                                placeholder="Detalhes adicionais..."
                                className="min-h-[100px] rounded-2xl bg-neutral-50 border-neutral-200 resize-none font-medium text-neutral-600 focus:border-neutral-400"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Assign to me Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-neutral-700">Registrar para mim</span>
                                    <span className="text-[10px] text-neutral-400 font-medium">Assumir este chamado automaticamente</span>
                                </div>
                            </div>
                            <Switch
                                checked={assignToMe}
                                onCheckedChange={setAssignToMe}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                className="w-full h-14 rounded-2xl text-base font-black tracking-wide shadow-lg shadow-neutral-900/10 active:scale-[0.98] transition-all"
                                onClick={handleSubmit}
                                disabled={!roomId || !title || createTicket.isPending}
                            >
                                {createTicket.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Chamado"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
