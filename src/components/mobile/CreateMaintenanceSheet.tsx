import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, Plus } from "lucide-react";

interface CreateMaintenanceSheetProps {
    children?: React.ReactNode;
    defaultRoomId?: string; // If opened from room detail
}

export const CreateMaintenanceSheet: React.FC<CreateMaintenanceSheetProps> = ({ children, defaultRoomId }) => {
    const [open, setOpen] = useState(false);
    const { selectedPropertyId } = useSelectedProperty();
    const { createTicket } = useMaintenance(selectedPropertyId);

    const [roomId, setRoomId] = useState(defaultRoomId || "");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    // Fetch rooms for selection
    const { data: rooms = [] } = useQuery({
        queryKey: ['rooms-simple', selectedPropertyId],
        queryFn: async () => {
            if (!selectedPropertyId) return [];
            const { data, error } = await supabase
                .from('rooms')
                .select('id, name, room_number')
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
            priority
        });

        setOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setPriority("medium");
        if (!defaultRoomId) setRoomId("");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0 flex items-center justify-center fixed bottom-6 right-6 z-50">
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[22px] min-h-[60vh] p-6">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-left text-lg font-bold">Novo Chamado</SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Local / Quarto</Label>
                        <Select value={roomId} onValueChange={setRoomId} disabled={!!defaultRoomId}>
                            <SelectTrigger className="h-12 rounded-xl bg-neutral-50 border-neutral-100">
                                <SelectValue placeholder="Selecione o local" />
                            </SelectTrigger>
                            <SelectContent>
                                {rooms.map(room => (
                                    <SelectItem key={room.id} value={room.id}>
                                        {room.room_number} - {room.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>O que aconteceu?</Label>
                        <Input
                            placeholder="Ex: Ar condicionado pingando"
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <div className="flex gap-2">
                            {(['low', 'medium', 'high'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 h-10 rounded-lg text-xs font-bold uppercase transition-all border ${priority === p
                                            ? p === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200'
                                                : p === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-200 ring-1 ring-orange-200'
                                                    : 'bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-200'
                                            : 'bg-white text-neutral-400 border-neutral-100'
                                        }`}
                                >
                                    {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Detalhes (Opcional)</Label>
                        <Textarea
                            placeholder="Descreva melhor o problema..."
                            className="min-h-[100px] rounded-xl bg-neutral-50 border-neutral-100 resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl text-base font-bold mt-4"
                        onClick={handleSubmit}
                        disabled={!roomId || !title || createTicket.isPending}
                    >
                        {createTicket.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Abrir Chamado"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
