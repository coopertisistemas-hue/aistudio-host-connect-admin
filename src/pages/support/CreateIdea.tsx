
import { useSupport } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres').max(100),
    description: z.string().min(20, 'Descreva sua ideia com detalhes (mín. 20 caracteres)'),
});

const CreateIdea = () => {
    const navigate = useNavigate();
    const { createIdea } = useSupport();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createIdea.mutate(values, {
            onSuccess: () => navigate('/support/ideas'),
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl py-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/support/ideas')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Sugerir Nova Ideia</CardTitle>
                    <CardDescription>O que tornaria sua experiência incrível? Conte para nós.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título da Ideia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Adicionar modo escuro no calendário" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Como isso ajudaria?</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Explique o benefício e como você imagina que funcionaria..."
                                                className="min-h-[150px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={createIdea.isPending} className="bg-amber-600 hover:bg-amber-700">
                                    {createIdea.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sugerir Ideia
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateIdea;
