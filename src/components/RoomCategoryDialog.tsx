import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomCategory, RoomCategoryInput, roomCategorySchema } from "@/hooks/useRoomCategories";

interface RoomCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: RoomCategory | null;
    onSubmit: (data: RoomCategoryInput) => void;
}

const RoomCategoryDialog = ({ open, onOpenChange, category, onSubmit }: RoomCategoryDialogProps) => {
    const form = useForm<RoomCategoryInput>({
        resolver: zodResolver(roomCategorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            display_order: 0,
        },
    });

    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
                slug: category.slug,
                description: category.description || "",
                display_order: category.display_order,
            });
        } else {
            form.reset({
                name: "",
                slug: "",
                description: "",
                display_order: 0,
            });
        }
    }, [category, open, form]);

    const handleFormSubmit = (data: RoomCategoryInput) => {
        onSubmit(data);
    };

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        form.setValue("name", name);
        if (!category) {
            const slug = name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            form.setValue("slug", slug);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{category ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {category ? "Edite os detalhes da categoria de acomodação." : "Cadastre uma nova categoria de acomodação."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Standard, Superior, Deluxe"
                            {...form.register("name")}
                            onChange={handleNameChange}
                        />
                        {form.formState.errors.name && (
                            <p className="text-destructive text-sm mt-1">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                            id="slug"
                            placeholder="standard"
                            {...form.register("slug")}
                            disabled={!!category}
                        />
                        {form.formState.errors.slug && (
                            <p className="text-destructive text-sm mt-1">
                                {form.formState.errors.slug.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            placeholder="Breve descrição da categoria"
                            rows={3}
                            {...form.register("description")}
                        />
                        {form.formState.errors.description && (
                            <p className="text-destructive text-sm mt-1">
                                {form.formState.errors.description.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="display_order">Ordem de Exibição</Label>
                        <Input
                            id="display_order"
                            type="number"
                            {...form.register("display_order", { valueAsNumber: true })}
                        />
                        {form.formState.errors.display_order && (
                            <p className="text-destructive text-sm mt-1">
                                {form.formState.errors.display_order.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {category ? "Atualizar" : "Criar Categoria"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RoomCategoryDialog;
