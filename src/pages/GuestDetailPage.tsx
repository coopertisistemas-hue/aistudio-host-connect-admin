import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useGuest } from '@/hooks/useGuests';
import { useGuestConsents } from '@/hooks/useGuestConsents';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Plus, CheckCircle2, XCircle, User, Mail, Phone, Calendar, FileText, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DataTableSkeleton from '@/components/DataTableSkeleton';
import { toast } from '@/hooks/use-toast';

const GuestDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isViewer = user?.user_metadata?.role === 'viewer';

    const { guest, isLoading, updateGuest } = useGuest(id);
    const { consents, isLoading: consentsLoading, createConsent } = useGuestConsents(id);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        document: '',
        email: '',
        phone: '',
        birthdate: '',
        notes: '',
    });

    const [showConsentForm, setShowConsentForm] = useState(false);
    const [consentForm, setConsentForm] = useState({
        type: 'data_processing' as 'data_processing' | 'marketing' | 'terms',
        granted: true,
        source: 'front_desk' as 'front_desk' | 'pre_checkin' | 'system',
    });

    // Initialize form when guest loads
    useEffect(() => {
        if (guest) {
            setFormData({
                first_name: guest.first_name || '',
                last_name: guest.last_name || '',
                document: guest.document || '',
                email: guest.email || '',
                phone: guest.phone || '',
                birthdate: guest.birthdate || '',
                notes: guest.notes || '',
            });
        }
    }, [guest]);

    const handleSave = async () => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para editar hóspedes.',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Nome e sobrenome são obrigatórios.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await updateGuest.mutateAsync(formData);
            setIsEditing(false);
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    const handleAddConsent = async () => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para adicionar consentimentos.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createConsent.mutateAsync(consentForm);
            setShowConsentForm(false);
            setConsentForm({
                type: 'data_processing',
                granted: true,
                source: 'front_desk',
            });
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    if (isLoading || !guest) {
        return (
            <DashboardLayout>
                <DataTableSkeleton />
            </DashboardLayout>
        );
    }

    const consentTypeLabels: Record<string, string> = {
        data_processing: 'Tratamento de Dados Pessoais',
        marketing: 'Comunicações de Marketing',
        terms: 'Termos de Uso',
    };

    const sourceLabels: Record<string, string> = {
        front_desk: 'Recepção',
        pre_checkin: 'Pré-Check-in',
        system: 'Sistema',
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/guests')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {guest.first_name} {guest.last_name}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Perfil do hóspede
                            </p>
                        </div>
                    </div>
                    {!isViewer && !isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            Editar Perfil
                        </Button>
                    )}
                    {isEditing && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    first_name: guest.first_name || '',
                                    last_name: guest.last_name || '',
                                    document: guest.document || '',
                                    email: guest.email || '',
                                    phone: guest.phone || '',
                                    birthdate: guest.birthdate || '',
                                    notes: guest.notes || '',
                                });
                            }}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={updateGuest.isPending}>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Guest Info Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Informações Pessoais</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="first_name">Nome *</Label>
                            <Input
                                id="first_name"
                                value={isEditing ? formData.first_name : guest.first_name || '-'}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Nome do hóspede"
                            />
                        </div>

                        <div>
                            <Label htmlFor="last_name">Sobrenome *</Label>
                            <Input
                                id="last_name"
                                value={isEditing ? formData.last_name : guest.last_name || '-'}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Sobrenome do hóspede"
                            />
                        </div>

                        <div>
                            <Label htmlFor="document">CPF</Label>
                            <Input
                                id="document"
                                value={isEditing ? formData.document : guest.document || '-'}
                                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                                disabled={!isEditing}
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div>
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={isEditing ? formData.email : guest.email || '-'}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={isEditing ? formData.phone : guest.phone || '-'}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div>
                            <Label htmlFor="birthdate">Data de Nascimento</Label>
                            <Input
                                id="birthdate"
                                type="date"
                                value={isEditing ? formData.birthdate : guest.birthdate || ''}
                                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                value={isEditing ? formData.notes : guest.notes || '-'}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Observações sobre o hóspede..."
                                rows={3}
                            />
                        </div>
                    </div>
                </Card>

                {/* Consents Card */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Consentimentos (LGPD)</h2>
                        </div>
                        {!isViewer && !showConsentForm && (
                            <Button onClick={() => setShowConsentForm(true)} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Consentimento
                            </Button>
                        )}
                    </div>

                    {showConsentForm && (
                        <div className="mb-6 p-4 bg-muted rounded-lg space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="consent_type">Tipo</Label>
                                    <Select
                                        value={consentForm.type}
                                        onValueChange={(value: any) => setConsentForm({ ...consentForm, type: value })}
                                    >
                                        <SelectTrigger id="consent_type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="data_processing">Tratamento de Dados</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="terms">Termos de Uso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="consent_granted">Status</Label>
                                    <Select
                                        value={consentForm.granted.toString()}
                                        onValueChange={(value) => setConsentForm({ ...consentForm, granted: value === 'true' })}
                                    >
                                        <SelectTrigger id="consent_granted">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Consentido</SelectItem>
                                            <SelectItem value="false">Recusado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="consent_source">Origem</Label>
                                    <Select
                                        value={consentForm.source}
                                        onValueChange={(value: any) => setConsentForm({ ...consentForm, source: value })}
                                    >
                                        <SelectTrigger id="consent_source">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="front_desk">Recepção</SelectItem>
                                            <SelectItem value="pre_checkin">Pré-Check-in</SelectItem>
                                            <SelectItem value="system">Sistema</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleAddConsent} disabled={createConsent.isPending}>
                                    Salvar Consentimento
                                </Button>
                                <Button variant="outline" onClick={() => setShowConsentForm(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    {consentsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Carregando consentimentos...
                        </div>
                    ) : consents.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">
                                Nenhum consentimento registrado
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {consents.map((consent) => (
                                <div key={consent.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {consent.granted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                )}
                                                <span className="font-semibold">
                                                    {consentTypeLabels[consent.type] || consent.type}
                                                </span>
                                                <Badge variant={consent.granted ? 'default' : 'destructive'}>
                                                    {consent.granted ? 'Consentido' : 'Recusado'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(consent.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                {' · '}
                                                Origem: {sourceLabels[consent.source] || consent.source}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default GuestDetailPage;
