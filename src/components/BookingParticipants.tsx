import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBookingGuests } from '@/hooks/useBookingGuests';
import { useGuests } from '@/hooks/useGuests';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Users, Star, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BookingParticipantsProps {
    bookingId: string;
}

const BookingParticipants = ({ bookingId }: BookingParticipantsProps) => {
    const { user } = useAuth();
    const isViewer = user?.user_metadata?.role === 'viewer';

    const { participants, isLoading, addParticipant, removeParticipant, setPrimaryParticipant } =
        useBookingGuests(bookingId);

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickAddForm, setQuickAddForm] = useState({
        full_name: '',
        document: '',
    });

    const { guests } = useGuests(searchTerm);

    const handleLinkExistingGuest = async (guestId: string, guestName: string) => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para adicionar participantes.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await addParticipant.mutateAsync({
                guest_id: guestId,
                full_name: guestName,
                is_primary: participants.length === 0, // First participant is primary
            });
            setShowAddDialog(false);
            setSearchTerm('');
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    const handleQuickAdd = async () => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para adicionar participantes.',
                variant: 'destructive',
            });
            return;
        }

        if (!quickAddForm.full_name.trim()) {
            toast({
                title: 'Campo obrigatório',
                description: 'O nome completo é obrigatório.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await addParticipant.mutateAsync({
                guest_id: null,
                full_name: quickAddForm.full_name,
                document: quickAddForm.document || null,
                is_primary: participants.length === 0, // First participant is primary
            });
            setShowAddDialog(false);
            setQuickAddForm({ full_name: '', document: '' });
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    const handleRemove = async (participantId: string, wasPrimary: boolean) => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para remover participantes.',
                variant: 'destructive',
            });
            return;
        }

        if (wasPrimary && participants.length === 1) {
            toast({
                title: 'Ação bloqueada',
                description: 'A reserva deve ter ao menos um hóspede principal.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await removeParticipant.mutateAsync({ participantId, wasPrimary });
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    const handleSetPrimary = async (participantId: string) => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para alterar o hóspede principal.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await setPrimaryParticipant.mutateAsync(participantId);
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                    Carregando participantes...
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Hóspedes</h3>
                    <Badge variant="secondary">{participants.length}</Badge>
                </div>
                {!isViewer && (
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Hóspedes
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Adicionar Hóspedes</DialogTitle>
                                <DialogDescription>
                                    Adicione hóspedes vinculando um cadastro existente ou criando um registro rápido.
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="existing" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing">Hóspede Cadastrado</TabsTrigger>
                                    <TabsTrigger value="quick">Adicionar Rápido</TabsTrigger>
                                </TabsList>

                                <TabsContent value="existing" className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome, email ou CPF..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {guests.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                {searchTerm
                                                    ? 'Nenhum hóspede encontrado'
                                                    : 'Digite para buscar hóspedes'}
                                            </div>
                                        ) : (
                                            guests.map((guest) => (
                                                <div
                                                    key={guest.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                                >
                                                    <div>
                                                        <p className="font-medium">
                                                            {guest.first_name} {guest.last_name}
                                                        </p>
                                                        <div className="text-sm text-muted-foreground space-x-2">
                                                            {guest.email && <span>{guest.email}</span>}
                                                            {guest.document && <span>· {guest.document}</span>}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleLinkExistingGuest(
                                                                guest.id,
                                                                `${guest.first_name} ${guest.last_name}`
                                                            )
                                                        }
                                                        disabled={addParticipant.isPending}
                                                    >
                                                        Adicionar
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="quick" className="space-y-4">
                                    <div>
                                        <Label htmlFor="quick_full_name">Nome Completo *</Label>
                                        <Input
                                            id="quick_full_name"
                                            placeholder="Ex: Maria Silva"
                                            value={quickAddForm.full_name}
                                            onChange={(e) =>
                                                setQuickAddForm({ ...quickAddForm, full_name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="quick_document">CPF (opcional)</Label>
                                        <Input
                                            id="quick_document"
                                            placeholder="000.000.000-00"
                                            value={quickAddForm.document}
                                            onChange={(e) =>
                                                setQuickAddForm({ ...quickAddForm, document: e.target.value })
                                            }
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button onClick={handleQuickAdd} disabled={addParticipant.isPending}>
                                            Adicionar
                                        </Button>
                                    </DialogFooter>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {participants.length === 0 ? (
                <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                        Nenhum hóspede adicionado à reserva
                    </p>
                    {!isViewer && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Clique em "Adicionar Hóspedes" para incluir participantes
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {participants.map((participant) => (
                        <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                {participant.is_primary && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{participant.full_name}</p>
                                        {participant.is_primary && (
                                            <Badge variant="secondary" className="text-xs">
                                                Principal
                                            </Badge>
                                        )}
                                    </div>
                                    {participant.document && (
                                        <p className="text-sm text-muted-foreground">
                                            CPF: {participant.document}
                                        </p>
                                    )}
                                    {participant.guests && (
                                        <p className="text-xs text-muted-foreground">
                                            Vinculado ao cadastro
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isViewer && (
                                <div className="flex items-center gap-2">
                                    {!participant.is_primary && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSetPrimary(participant.id)}
                                            disabled={setPrimaryParticipant.isPending}
                                        >
                                            Marcar como Principal
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remover hóspede?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja remover {participant.full_name} desta reserva?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleRemove(participant.id, !!participant.is_primary)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Remover
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default BookingParticipants;
