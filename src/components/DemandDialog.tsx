import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRooms } from "@/hooks/useRooms";
import { Construction, Loader2 } from "lucide-react";

const demandSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    description: z.string().optional(),
    category: z.string().min(1, "A categoria é obrigatória"),
    priority: z.enum(["low", "medium", "high", "critical"]),
    room_id: z.string().optional().nullable(),
    impact_operation: z.boolean().default(false),
    status: z.enum(["todo", "in-progress", "waiting", "done"]).default("todo"),
});

type DemandFormValues = z.infer<typeof demandSchema>;

interface DemandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: DemandFormValues) => void;
    isLoading?: boolean;
    propertyId?: string;
}

export const DemandDialog = ({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    propertyId
}: DemandDialogProps) => {
    const { rooms } = useRooms(propertyId);
    const form = useForm<DemandFormValues>({
        resolver: zodResolver(demandSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "Manutenção Geral",
            priority: "medium",
            room_id: null,
            impact_operation: false,
            status: "todo",
        },
    });

    useEffect(() => {
        if (open) form.reset();
    }, [open, form]);

    const categories = [
        "Ar Condicionado",
        "Elétrica",
        "Hidráulica",
        "Mobiliário",
        "Pintura",
        "Manutenção Geral",
        "Outros"
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Construction className="h-5 w-5 text-primary" />
                        <DialogTitle>Nova Demanda de Manutenção</DialogTitle>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Vazamento no banheiro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prioridade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Baixa</SelectItem>
                                                <SelectItem value="medium">Média</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                                <SelectItem value="critical">Crítica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="room_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quarto (Opcional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o quarto" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum / Área Comum</SelectItem>
                                            {rooms?.map(room => (
                                                <SelectItem key={room.id} value={room.id}>
                                                    Quarto {room.room_number} ({room.room_types?.name})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalhes sobre o problema..."
                                            className="resize-none h-20"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="impact_operation"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-muted/30">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-bold text-rose-600">
                                            Impacta Operação?
                                        </FormLabel>
                                        <p className="text-[10px] text-muted-foreground">
                                            Isso marcará o quarto como <b>Fora de Serviço (OOO)</b>.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    "Criar Demanda"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
