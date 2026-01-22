import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrg } from '@/hooks/useOrg';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface PreCheckinSubmissionsProps {
    bookingId: string;
}

interface Submission {
    id: string;
    session_id: string;
    status: string;
    mode?: string; // 'individual' or 'group'
    payload: Record<string, any>; // Changed from string to any to support group payloads
    created_at: string;
}

const PreCheckinSubmissionsComponent = ({ bookingId }: PreCheckinSubmissionsProps) => {
    const { user } = useAuth();
    const { currentOrgId } = useOrg();
    const queryClient = useQueryClient();
    const isViewer = user?.user_metadata?.role === 'viewer';

    // State for batch selection
    const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
    const [isBatchApplying, setIsBatchApplying] = useState(false);

    // Fetch sessions for this booking
    const { data: sessions } = useQuery({
        queryKey: ['pre_checkin_sessions', currentOrgId, bookingId],
        queryFn: async () => {
            if (!currentOrgId || !bookingId) return [];

            const { data, error } = await supabase
                .from('pre_checkin_sessions')
                .select('id')
                .eq('org_id', currentOrgId)
                .eq('booking_id', bookingId);

            if (error) throw error;
            return data || [];
        },
        enabled: !!currentOrgId && !!bookingId,
    });

    const sessionIds = sessions?.map((s) => s.id) || [];

    // Fetch submissions for these sessions
    const { data: submissions, isLoading } = useQuery({
        queryKey: ['pre_checkin_submissions', currentOrgId, bookingId, sessionIds],
        queryFn: async () => {
            if (!currentOrgId || sessionIds.length === 0) return [];

            const { data, error } = await supabase
                .from('pre_checkin_submissions')
                .select('*')
                .eq('org_id', currentOrgId)
                .in('session_id', sessionIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Submission[];
        },
        enabled: !!currentOrgId && sessionIds.length > 0,
    });

    // Apply submission mutation
    const applySubmission = useMutation({
        mutationFn: async (submission: Submission) => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (isViewer) throw new Error('Viewer cannot apply submissions');

            const mode = submission.mode || 'individual';

            if (mode === 'group') {
                // Group mode: process multiple participants
                const participants = submission.payload.participants || [];
                if (participants.length === 0) throw new Error('No participants in group submission');

                let processedCount = 0;
                let failedCount = 0;

                // Check if booking already has a primary participant
                const { data: existingPrimary } = await (supabase as any)
                    .from('booking_guests')
                    .select('id')
                    .eq('org_id', currentOrgId)
                    .eq('booking_id', bookingId)
                    .eq('is_primary', true)
                    .limit(1);

                let hasPrimary = existingPrimary && existingPrimary.length > 0;

                for (const [index, participant] of participants.entries()) {
                    try {
                        // Step 1: Upsert guest master
                        let guestId: string | null = null;

                        // Try to find existing guest by document or email
                        if (participant.document || participant.email) {
                            const { data: existingGuests } = await (supabase as any)
                                .from('guests')
                                .select('id')
                                .eq('org_id', currentOrgId)
                                .or(
                                    participant.document
                                        ? `document.eq.${participant.document}`
                                        : participant.email
                                            ? `email.eq.${participant.email}`
                                            : 'id.eq.00000000-0000-0000-0000-000000000000'
                                )
                                .limit(1);

                            if (existingGuests && existingGuests.length > 0) {
                                guestId = existingGuests[0].id;

                                // Update existing guest
                                await (supabase as any)
                                    .from('guests')
                                    .update({
                                        first_name: participant.full_name.split(' ')[0] || participant.full_name,
                                        last_name: participant.full_name.split(' ').slice(1).join(' ') || '',
                                        document: participant.document || null,
                                        email: participant.email || null,
                                        phone: participant.phone || null,
                                    })
                                    .eq('id', guestId)
                                    .eq('org_id', currentOrgId);
                            }
                        }

                        // If no existing guest, create new
                        if (!guestId) {
                            const { data: newGuest, error: guestError } = await (supabase as any)
                                .from('guests')
                                .insert({
                                    org_id: currentOrgId,
                                    first_name: participant.full_name.split(' ')[0] || participant.full_name,
                                    last_name: participant.full_name.split(' ').slice(1).join(' ') || '',
                                    document: participant.document || null,
                                    email: participant.email || null,
                                    phone: participant.phone || null,
                                })
                                .select('id')
                                .single();

                            if (guestError) throw guestError;
                            guestId = newGuest.id;
                        }

                        // Insert booking_guests - first participant becomes primary if none exists
                        const shouldBePrimary = !hasPrimary && index === 0;

                        const { error: bookingGuestError } = await (supabase as any)
                            .from('booking_guests')
                            .insert({
                                org_id: currentOrgId,
                                booking_id: bookingId,
                                guest_id: guestId,
                                full_name: participant.full_name,
                                document: participant.document || null,
                                is_primary: shouldBePrimary,
                            });

                        if (bookingGuestError) throw bookingGuestError;

                        if (shouldBePrimary) hasPrimary = true;
                        processedCount++;
                    } catch (err) {
                        console.error('Failed to process participant:', participant, err);
                        failedCount++;
                    }
                }

                // Update submission status
                const { error: statusError } = await (supabase as any)
                    .from('pre_checkin_submissions')
                    .update({ status: 'applied' })
                    .eq('id', submission.id)
                    .eq('org_id', currentOrgId);

                if (statusError) throw statusError;

                // Show summary
                if (failedCount > 0) {
                    toast({
                        title: 'Aplicação Parcial',
                        description: `${processedCount} participante(s) adicionado(s). ${failedCount} falharam.`,
                        variant: 'destructive',
                    });
                }
            } else {
                // Individual mode: original logic
                const payload = submission.payload;

                // Step 1: Upsert guest master
                let guestId: string | null = null;

                // Try to find existing guest by document or email
                if (payload.document || payload.email) {
                    const { data: existingGuests } = await (supabase as any)
                        .from('guests')
                        .select('id')
                        .eq('org_id', currentOrgId)
                        .or(
                            payload.document
                                ? `document.eq.${payload.document}`
                                : payload.email
                                    ? `email.eq.${payload.email}`
                                    : 'id.eq.00000000-0000-0000-0000-000000000000'
                        )
                        .limit(1);

                    if (existingGuests && existingGuests.length > 0) {
                        guestId = existingGuests[0].id;

                        // Update existing guest
                        await (supabase as any)
                            .from('guests')
                            .update({
                                first_name: payload.full_name.split(' ')[0] || payload.full_name,
                                last_name: payload.full_name.split(' ').slice(1).join(' ') || '',
                                document: payload.document || null,
                                email: payload.email || null,
                                phone: payload.phone || null,
                                birthdate: payload.birthdate || null,
                            })
                            .eq('id', guestId)
                            .eq('org_id', currentOrgId);
                    }
                }

                // If no existing guest, create new
                if (!guestId) {
                    const { data: newGuest, error: guestError } = await (supabase as any)
                        .from('guests')
                        .insert({
                            org_id: currentOrgId,
                            first_name: payload.full_name.split(' ')[0] || payload.full_name,
                            last_name: payload.full_name.split(' ').slice(1).join(' ') || '',
                            document: payload.document || null,
                            email: payload.email || null,
                            phone: payload.phone || null,
                            birthdate: payload.birthdate || null,
                        })
                        .select('id')
                        .single();

                    if (guestError) throw guestError;
                    guestId = newGuest.id;
                }

                // Step 2: Check if booking already has a primary participant
                const { data: existingPrimary } = await (supabase as any)
                    .from('booking_guests')
                    .select('id')
                    .eq('org_id', currentOrgId)
                    .eq('booking_id', bookingId)
                    .eq('is_primary', true)
                    .limit(1);

                const shouldBePrimary = !existingPrimary || existingPrimary.length === 0;

                // Step 3: Insert booking_guests
                const { error: bookingGuestError } = await (supabase as any)
                    .from('booking_guests')
                    .insert({
                        org_id: currentOrgId,
                        booking_id: bookingId,
                        guest_id: guestId,
                        full_name: payload.full_name,
                        document: payload.document || null,
                        is_primary: shouldBePrimary,
                    });

                if (bookingGuestError) throw bookingGuestError;

                // Step 3: Update submission status
                const { error: statusError } = await (supabase as any)
                    .from('pre_checkin_submissions')
                    .update({ status: 'applied' })
                    .eq('id', submission.id)
                    .eq('org_id', currentOrgId);

                if (statusError) throw statusError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pre_checkin_submissions', currentOrgId] });
            queryClient.invalidateQueries({ queryKey: ['booking_guests', currentOrgId, bookingId] });
            toast({
                title: 'Sucesso',
                description: 'Pré-check-in aplicado ao check-in.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao aplicar pré-check-in.',
                variant: 'destructive',
            });
        },
    });

    // Reject submission mutation
    const rejectSubmission = useMutation({
        mutationFn: async (submissionId: string) => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (isViewer) throw new Error('Viewer cannot reject submissions');

            const { error } = await supabase
                .from('pre_checkin_submissions')
                .update({ status: 'rejected' })
                .eq('id', submissionId)
                .eq('org_id', currentOrgId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pre_checkin_submissions', currentOrgId] });
            toast({
                title: 'Sucesso',
                description: 'Pré-check-in rejeitado.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao rejeitar pré-check-in.',
                variant: 'destructive',
            });
        },
    });

    const handleApply = async (submission: Submission) => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para aplicar pré-check-ins.',
                variant: 'destructive',
            });
            return;
        }

        await applySubmission.mutateAsync(submission);
    };

    const handleReject = async (submissionId: string) => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para rejeitar pré-check-ins.',
                variant: 'destructive',
            });
            return;
        }

        await rejectSubmission.mutateAsync(submissionId);
    };

    const handleBatchApply = async () => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para aplicar pré-check-ins.',
                variant: 'destructive',
            });
            return;
        }

        const selectedArray = Array.from(selectedSubmissions);
        if (selectedArray.length === 0) return;

        setIsBatchApplying(true);

        const results = { success: 0, failed: 0 };

        for (const submissionId of selectedArray) {
            const submission = submissions?.find((s) => s.id === submissionId);
            if (!submission) continue;

            try {
                await applySubmission.mutateAsync(submission);
                results.success++;
            } catch (error) {
                results.failed++;
            }
        }

        setIsBatchApplying(false);
        setSelectedSubmissions(new Set());

        // Show summary toast
        if (results.failed === 0) {
            toast({
                title: 'Sucesso',
                description: `${results.success} pré-check-ins aplicados com sucesso.`,
            });
        } else {
            toast({
                title: 'Aplicação parcial',
                description: `${results.success} aplicados com sucesso, ${results.failed} com erro.`,
                variant: results.success > 0 ? 'default' : 'destructive',
            });
        }
    };

    const toggleSelection = (submissionId: string) => {
        const newSelection = new Set(selectedSubmissions);
        if (newSelection.has(submissionId)) {
            newSelection.delete(submissionId);
        } else {
            newSelection.add(submissionId);
        }
        setSelectedSubmissions(newSelection);
    };

    const toggleSelectAll = () => {
        const pendingSubmissions = submissions?.filter((s) => s.status === 'submitted') || [];
        if (selectedSubmissions.size === pendingSubmissions.length) {
            setSelectedSubmissions(new Set());
        } else {
            setSelectedSubmissions(new Set(pendingSubmissions.map((s) => s.id)));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'submitted':
                return <Badge variant="secondary">Pendente</Badge>;
            case 'applied':
                return <Badge variant="default" className="bg-green-600">Aplicado</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejeitado</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                    Carregando pré-check-ins...
                </div>
            </Card>
        );
    }

    if (!submissions || submissions.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Pré-Check-ins Recebidos</h3>
                        <Badge variant="secondary">0</Badge>
                    </div>
                </div>
                <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                        Nenhum pré-check-in enviado para esta reserva
                    </p>
                </div>
            </Card>
        );
    }

    // Calculate progress indicators
    const submittedCount = submissions.filter((s) => s.status === 'submitted').length;
    const appliedCount = submissions.filter((s) => s.status === 'applied').length;
    const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Pré-Check-ins Recebidos</h3>
                    <Badge variant="secondary">{submissions.length}</Badge>
                </div>

                {!isViewer && submissions.some((s) => s.status === 'submitted') && (
                    <div className="flex items-center gap-2">
                        {selectedSubmissions.size > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        disabled={isBatchApplying || selectedSubmissions.size === 0}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Aplicar selecionados ({selectedSubmissions.size})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Aplicar pré-check-ins selecionados?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {selectedSubmissions.size} pré-check-ins serão aplicados ao check-in.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleBatchApply}
                                            disabled={isBatchApplying}
                                        >
                                            Confirmar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Indicators */}
            <div className="flex items-center gap-4 mb-3 p-3 bg-muted/20 rounded-lg border border-muted">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Pré-check-in:</span>
                    <Badge variant="secondary" className="font-mono">
                        {submittedCount} enviados
                    </Badge>
                    <span className="text-muted-foreground">/</span>
                    <Badge variant="default" className="bg-green-600 font-mono">
                        {appliedCount} aplicados
                    </Badge>
                    {rejectedCount > 0 && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <Badge variant="destructive" className="font-mono">
                                {rejectedCount} rejeitados
                            </Badge>
                        </>
                    )}
                </div>
            </div>

            {!isViewer && submissions.some((s) => s.status === 'submitted') && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                        id="select-all"
                        checked={
                            selectedSubmissions.size > 0 &&
                            selectedSubmissions.size === submissions.filter((s) => s.status === 'submitted').length
                        }
                        onCheckedChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        Selecionar todos pendentes
                    </label>
                </div>
            )}

            <div className="space-y-3">
                {submissions.map((submission) => {
                    const payload = submission.payload;
                    const isPending = submission.status === 'submitted';

                    return (
                        <div
                            key={submission.id}
                            className="flex items-start justify-between p-4 border rounded-lg"
                        >
                            {!isViewer && isPending && (
                                <div className="flex items-start pt-1 mr-3">
                                    <Checkbox
                                        checked={selectedSubmissions.has(submission.id)}
                                        onCheckedChange={() => toggleSelection(submission.id)}
                                    />
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {getStatusBadge(submission.status)}
                                    {submission.mode === 'group' && (
                                        <Badge variant="outline" className="gap-1">
                                            <Users className="h-3 w-3" />
                                            Grupo ({payload.participants?.length || 0} participantes)
                                        </Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        Recebido em {format(new Date(submission.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>

                                {submission.mode === 'group' ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Participantes do grupo:
                                        </p>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                            {(payload.participants || []).map((participant: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 bg-muted/30 rounded border border-muted text-sm"
                                                >
                                                    <p className="font-medium">{participant.full_name}</p>
                                                    <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                                                        {participant.document && <div>CPF: {participant.document}</div>}
                                                        {participant.email && <div>E-mail: {participant.email}</div>}
                                                        {participant.phone && <div>Telefone: {participant.phone}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="font-medium">{payload.full_name}</p>
                                        <div className="text-sm text-muted-foreground space-y-0.5">
                                            {payload.document && <div>CPF: {payload.document}</div>}
                                            {payload.email && <div>E-mail: {payload.email}</div>}
                                            {payload.phone && <div>Telefone: {payload.phone}</div>}
                                            {payload.birthdate && (
                                                <div>
                                                    Nascimento: {format(new Date(payload.birthdate), 'dd/MM/yyyy', { locale: ptBR })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isViewer && isPending && (
                                <div className="flex items-center gap-2 ml-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={applySubmission.isPending || rejectSubmission.isPending || isBatchApplying}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Aplicar
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Aplicar Pré-Check-in?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Isto irá criar/atualizar o cadastro do hóspede e adicionar à reserva.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleApply(submission)}
                                                    disabled={applySubmission.isPending}
                                                >
                                                    Confirmar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={applySubmission.isPending || rejectSubmission.isPending || isBatchApplying}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Rejeitar
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Rejeitar Pré-Check-in?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    O pré-check-in será marcado como rejeitado.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleReject(submission.id)}
                                                    disabled={rejectSubmission.isPending}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Rejeitar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default PreCheckinSubmissionsComponent;
