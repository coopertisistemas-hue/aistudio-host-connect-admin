import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PreCheckinSession {
    id: string;
    org_id: string;
    booking_id: string;
    status: string;
    expires_at: string;
}

const PublicPreCheckinPage = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<PreCheckinSession | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        document: '',
        email: '',
        phone: '',
        birthdate: '',
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError('Link inválido ou expirado.');
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Validate required fields
        if (!formData.full_name.trim()) {
            setValidationError('O nome completo é obrigatório.');
            return;
        }

        // At least one identifier must be filled
        if (!formData.document.trim() && !formData.email.trim() && !formData.phone.trim()) {
            setValidationError('Preencha pelo menos um dos campos: CPF, E-mail ou Telefone.');
            return;
        }

        if (!session) return;

        setSubmitting(true);

        try {
            // Build payload with only non-empty fields
            const payload: Record<string, string> = {
                full_name: formData.full_name.trim(),
            };

            if (formData.document.trim()) payload.document = formData.document.trim();
            if (formData.email.trim()) payload.email = formData.email.trim();
            if (formData.phone.trim()) payload.phone = formData.phone.trim();
            if (formData.birthdate.trim()) payload.birthdate = formData.birthdate.trim();

            const { error: insertError } = await supabase
                .from('pre_checkin_submissions')
                .insert({
                    org_id: session.org_id,
                    session_id: session.id,
                    status: 'submitted',
                    payload,
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
                <Card className="max-w-md w-full p-8">
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
                <Card className="max-w-md w-full p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Link Inválido ou Expirado</h2>
                            <p className="text-muted-foreground">
                                Entre em contato com o estabelecimento para obter um novo link.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Success state
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Pré-Check-in Enviado com Sucesso!</h2>
                            <p className="text-muted-foreground">
                                Seus dados foram recebidos. Aguarde a confirmação da recepção.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Pré-Check-in</h1>
                    <p className="text-muted-foreground">
                        Preencha seus dados para agilizar o check-in.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="full_name">
                            Nome Completo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="full_name"
                            type="text"
                            placeholder="Ex: Maria Silva"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="document">CPF</Label>
                        <Input
                            id="document"
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.document}
                            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="exemplo@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="birthdate">Data de Nascimento</Label>
                        <Input
                            id="birthdate"
                            type="date"
                            value={formData.birthdate}
                            onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                        />
                    </div>

                    {validationError && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">{validationError}</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Pré-Check-in'
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        * Campos obrigatórios. Preencha pelo menos um dos campos: CPF, E-mail ou Telefone.
                    </p>
                </form>
            </Card>
        </div>
    );
};

export default PublicPreCheckinPage;
