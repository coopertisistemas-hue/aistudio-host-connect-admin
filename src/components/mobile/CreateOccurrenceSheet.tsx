import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOperationsNow } from "@/hooks/useOperationsNow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, Plus, AlertTriangle } from "lucide-react";

export const CreateOccurrenceSheet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const { selectedPropertyId } = useSelectedProperty();
    const { createOccurrence } = useOperationsNow(selectedPropertyId);

    const [roomId, setRoomId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    // Fetch rooms for optional selection
    const { data: rooms = [] } = useQuery({
        queryKey: ['rooms-simple', selectedPropertyId],
        queryFn: async () => {
            if (!selectedPropertyId) return [];
            const { data } = await supabase
                .from('rooms')
                .select('id, name, room_number')
                .eq('property_id', selectedPropertyId)
                .order('room_number');
            return data || [];
        },
        enabled: !!selectedPropertyId && open
    });

    const handleSubmit = async () => {
        if (!title) return;

        await createOccurrence.mutateAsync({
            roomId: roomId || undefined,
            title,
            description,
            priority
        });

        setOpen(false);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setRoomId("");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                        <Plus className="h-4 w-4" /> Nova
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[22px] min-h-[60vh] p-6">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-left text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        Registrar Ocorrência
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>O que houve?</Label>
                        <Input
                            placeholder="Ex: Hóspede perdeu chave, Barulho no corredor..."
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Local (Opcional)</Label>
                        <Select value={roomId} onValueChange={setRoomId}>
                            <SelectTrigger className="h-12 rounded-xl bg-neutral-50 border-neutral-100">
                                <SelectValue placeholder="Selecione se houver quarto envolvido" />
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
                        <Label>Detalhes</Label>
                        <Textarea
                            placeholder="Descreva a situação..."
                            className="min-h-[100px] rounded-xl bg-neutral-50 border-neutral-100 resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl text-base font-bold mt-4"
                        onClick={handleSubmit}
                        disabled={!title || createOccurrence.isPending}
                    >
                        {createOccurrence.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Registrar"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
