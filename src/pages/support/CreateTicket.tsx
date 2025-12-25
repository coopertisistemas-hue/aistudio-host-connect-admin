
import { useSupport } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
    title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres').max(100),
    description: z.string().min(20, 'Descreva o problema com mais detalhes (mín. 20 caracteres)'),
    category: z.enum(['bug', 'billing', 'general'], { required_error: 'Selecione uma categoria' }),
    severity: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Selecione a gravidade' }),
});

const CreateTicket = () => {
    const navigate = useNavigate();
    const { createTicket } = useSupport();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            category: 'general',
            severity: 'low',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createTicket.mutate(values, {
            onSuccess: () => navigate('/support/tickets'),
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl py-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/support/tickets')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Abrir Novo Chamado</CardTitle>
                    <CardDescription>Descreva o problema ou solicitação. Nossa equipe responderá o mais breve possível.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título do Assunto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Erro ao gerar relatório de reservas" {...field} />
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
                                                    <SelectItem value="bug">Relatar Erro (Bug)</SelectItem>
                                                    <SelectItem value="billing">Financeiro / Cobrança</SelectItem>
                                                    <SelectItem value="general">Dúvidas Gerais</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="severity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Impacto (Gravidade)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">Baixo (Dúvida simples)</SelectItem>
                                                    <SelectItem value="medium">Médio (Funcionalidade lenta)</SelectItem>
                                                    <SelectItem value="high">Alto (Funcionalidade quebrada)</SelectItem>
                                                    <SelectItem value="critical">Crítico (Sistema inacessível)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição Detalhada</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva o passo a passo para reproduzir o problema ou os detalhes da sua solicitação..."
                                                className="min-h-[150px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={createTicket.isPending}>
                                    {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Abrir Chamado
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateTicket;
