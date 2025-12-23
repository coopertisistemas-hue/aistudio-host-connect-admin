import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePantry } from "@/hooks/usePantry";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Loader2, Plus, UtensilsCrossed } from "lucide-react";

export const CreatePantrySheet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const { selectedPropertyId } = useSelectedProperty();
    const { createPantryTask } = usePantry(selectedPropertyId);

    const [roomId, setRoomId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Fetch rooms for optional selection
    const { data: rooms = [] } = useQuery({
        queryKey: ['rooms-simple', selectedPropertyId],
        queryFn: async () => {
            if (!selectedPropertyId) return [];
            const { data, error } = await supabase
                .from('rooms')
                .select('id, name, room_number')
                .eq('property_id', selectedPropertyId)
                .order('room_number'); // Removed typed selection to avoid error for now if types are mismatching

            if (error) throw error;
            // Explicit cast to avoid Type instantiation too deep or property missing errors
            return (data || []) as unknown as { id: string; name: string; room_number: string }[];
        },
        enabled: !!selectedPropertyId && open
    });

    const handleSubmit = async () => {
        if (!title) return;

        await createPantryTask.mutateAsync({
            roomId: roomId || undefined,
            title,
            description,
            priority: 'medium'
        });

        setOpen(false);
        setTitle("");
        setDescription("");
        setRoomId("");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                        <Plus className="h-4 w-4" /> Nova
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[22px] min-h-[50vh] p-6 max-w-md mx-auto">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-left text-lg font-bold flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                        Nova Solicitação (Copa)
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>O que é necessário?</Label>
                        <Input
                            placeholder="Ex: Sanduíche, Reposição de frigobar..."
                            className="h-12 rounded-xl bg-neutral-50 border-neutral-100"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Local (Opcional)</Label>
                        <Select value={roomId} onValueChange={setRoomId}>
                            <SelectTrigger className="h-12 rounded-xl bg-neutral-50 border-neutral-100">
                                <SelectValue placeholder="Selecione se for para um quarto" />
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
                        <Label>Detalhes</Label>
                        <Textarea
                            placeholder="Observações adicionais..."
                            className="min-h-[80px] rounded-xl bg-neutral-50 border-neutral-100 resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl text-base font-bold mt-4"
                        onClick={handleSubmit}
                        disabled={!title || createPantryTask.isPending}
                    >
                        {createPantryTask.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar Solicitação"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
