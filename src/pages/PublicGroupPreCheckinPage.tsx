import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Plus, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PreCheckinSession {
    id: string;
    org_id: string;
    booking_id: string;
    status: string;
    expires_at: string;
}

interface Participant {
    id: string;
    full_name: string;
    document: string;
    email: string;
    phone: string;
}

const PublicGroupPreCheckinPage = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<PreCheckinSession | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Initial participant for the form
    const [participants, setParticipants] = useState<Participant[]>([
        { id: crypto.randomUUID(), full_name: '', document: '', email: '', phone: '' },
    ]);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError('Link inválido ou expirado.');
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await (supabase as any)
                    .from('pre_checkin_sessions')
                    .select('id, org_id, booking_id, status, expires_at')
                    .eq('token', token)
                    .single();

                if (fetchError || !data) {
                    setError('Link inválido ou expirado.');
                    setLoading(false);
                    return;
                }

                // Validate status
                if (data.status !== 'pending') {
                    setError('Link inválido ou expirado.');
                    setLoading(false);
                    return;
                }

                // Validate expiry
                const expiresAt = new Date(data.expires_at);
                if (expiresAt < new Date()) {
                    setError('Link inválido ou expirado.');
                    setLoading(false);
                    return;
                }

                setSession(data);
                setLoading(false);
            } catch (err) {
                setError('Link inválido ou expirado.');
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const addParticipant = () => {
        setParticipants([
            ...participants,
            { id: crypto.randomUUID(), full_name: '', document: '', email: '', phone: '' },
        ]);
    };

    const removeParticipant = (id: string) => {
        if (participants.length === 1) {
            setValidationError('Pelo menos um participante é necessário.');
            return;
        }
        setParticipants(participants.filter(p => p.id !== id));
    };

    const updateParticipant = (id: string, field: keyof Participant, value: string) => {
        setParticipants(
            participants.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Validate each participant
        for (const participant of participants) {
            if (!participant.full_name.trim()) {
                setValidationError('O nome completo é obrigatório para todos os participantes.');
                return;
            }

            // At least one identifier must be filled for each participant
            if (
                !participant.document.trim() &&
                !participant.email.trim() &&
                !participant.phone.trim()
            ) {
                setValidationError(
                    `Para ${participant.full_name}: Preencha pelo menos um dos campos: CPF, E-mail ou Telefone.`
                );
                return;
            }
        }

        if (!session) return;

        setSubmitting(true);

        try {
            // Build payload with cleaned participant data
            const cleanedParticipants = participants.map(p => {
                const cleaned: Record<string, string> = {
                    full_name: p.full_name.trim(),
                };

                if (p.document.trim()) cleaned.document = p.document.trim();
                if (p.email.trim()) cleaned.email = p.email.trim();
                if (p.phone.trim()) cleaned.phone = p.phone.trim();

                return cleaned;
            });

            const { error: insertError } = await (supabase as any)
                .from('pre_checkin_submissions')
                .insert({
                    org_id: session.org_id,
                    session_id: session.id,
                    status: 'submitted',
                    mode: 'group',
                    payload: { participants: cleanedParticipants },
                });

            if (insertError) {
                throw insertError;
            }

            setSubmitted(true);
        } catch (err) {
            setValidationError('Erro ao enviar dados. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full p-8">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Validando link...</p>
                    </div>
                </Card>
            </div>
        );
    }

    // Error state (invalid/expired token)
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <XCircle className="h-12 w-12 text-destructive" />
                        <h2 className="text-2xl font-bold">Link Inválido</h2>
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                </Card>
            </div>
        );
    }

    // Success state (after submission)
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <CheckCircle className="h-12 w-12 text-success" />
                        <h2 className="text-2xl font-bold">Dados Enviados com Sucesso!</h2>
                        <p className="text-muted-foreground">
                            Os dados do grupo foram recebidos pela recepção. Aguarde a confirmação do check-in na sua chegada.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
            <Card className="max-w-2xl w-full">
                <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle>Pré-Check-in de Grupo</CardTitle>
                            <CardDescription>
                                Informe os dados dos participantes do grupo
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {validationError && (
                            <Alert variant="destructive">
                                <AlertDescription>{validationError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-6">
                            {participants.map((participant, index) => (
                                <Card key={participant.id} className="border-2 border-muted">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">
                                                Participante {index + 1}
                                            </CardTitle>
                                            {participants.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeParticipant(participant.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`name-${participant.id}`}>
                                                Nome Completo *
                                            </Label>
                                            <Input
                                                id={`name-${participant.id}`}
                                                value={participant.full_name}
                                                onChange={(e) =>
                                                    updateParticipant(participant.id, 'full_name', e.target.value)
                                                }
                                                placeholder="Ex: João da Silva"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`document-${participant.id}`}>CPF</Label>
                                                <Input
                                                    id={`document-${participant.id}`}
                                                    value={participant.document}
                                                    onChange={(e) =>
                                                        updateParticipant(participant.id, 'document', e.target.value)
                                                    }
                                                    placeholder="000.000.000-00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`email-${participant.id}`}>E-mail</Label>
                                                <Input
                                                    id={`email-${participant.id}`}
                                                    type="email"
                                                    value={participant.email}
                                                    onChange={(e) =>
                                                        updateParticipant(participant.id, 'email', e.target.value)
                                                    }
                                                    placeholder="joao@email.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`phone-${participant.id}`}>Telefone</Label>
                                                <Input
                                                    id={`phone-${participant.id}`}
                                                    value={participant.phone}
                                                    onChange={(e) =>
                                                        updateParticipant(participant.id, 'phone', e.target.value)
                                                    }
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            * Preencha pelo menos um dos campos: CPF, E-mail ou Telefone
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addParticipant}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" /> Adicionar Participante
                            </Button>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button type="submit" disabled={submitting} className="gap-2">
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>Enviar Dados do Grupo</>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default PublicGroupPreCheckinPage;
