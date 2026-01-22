import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingState, useUpdateOnboarding, OnboardingMode } from '@/hooks/useOnboardingState';
import { useProperties } from '@/hooks/useProperties';
import { useRooms } from '@/hooks/useRooms';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check, Building2, Home, Hotel, ChevronRight, ChevronLeft } from 'lucide-react';

const SetupWizardPage = () => {
    const navigate = useNavigate();
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const { onboarding, isLoading: onboardingLoading } = useOnboardingState();
    const { mutate: updateOnboarding, isPending: isUpdating } = useUpdateOnboarding();
    const { properties } = useProperties();
    const { refetch: refetchRooms } = useRooms(onboarding?.property_id || undefined);

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState<OnboardingMode>(null);
    const [propertyName, setPropertyName] = useState('');
    const [propertyCity, setPropertyCity] = useState('');
    const [propertyState, setPropertyState] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [roomCount, setRoomCount] = useState<number>(5);
    const [isCreatingRooms, setIsCreatingRooms] = useState(false);

    // Load state from onboarding
    useEffect(() => {
        if (onboarding && !onboardingLoading) {
            setCurrentStep(onboarding.last_step || 1);
            setSelectedMode(onboarding.mode);
            setSelectedPropertyId(onboarding.property_id);
        }
    }, [onboarding, onboardingLoading]);

    const totalSteps = 5;
    const progress = (currentStep / totalSteps) * 100;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            updateOnboarding({ last_step: nextStep });
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            updateOnboarding({ last_step: prevStep });
        }
    };

    const handleModeSelect = (mode: OnboardingMode) => {
        setSelectedMode(mode);
        updateOnboarding({ mode, last_step: 1 });
    };

    const handleCreateProperty = async () => {
        if (!propertyName || !propertyCity || !propertyState) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha nome, cidade e estado.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('properties')
                .insert({
                    org_id: currentOrgId,
                    name: propertyName,
                    city: propertyCity,
                    state: propertyState,
                    address: `${propertyCity}, ${propertyState}`,
                    total_rooms: roomCount,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;

            setSelectedPropertyId(data.id);
            updateOnboarding({ property_id: data.id, last_step: 2 });

            toast({
                title: 'Propriedade criada',
                description: 'Sua propriedade foi configurada com sucesso.',
            });
        } catch (error: any) {
            toast({
                title: 'Erro ao criar propriedade',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleBulkCreateRooms = async (count: number) => {
        if (!selectedPropertyId || !currentOrgId) {
            toast({
                title: 'Erro',
                description: 'Propriedade não selecionada',
                variant: 'destructive',
            });
            return;
        }

        setIsCreatingRooms(true);

        try {
            // Check existing rooms
            const { data: existingRooms } = await supabase
                .from('rooms')
                .select('room_number')
                .eq('property_id', selectedPropertyId)
                .order('room_number', { ascending: false })
                .limit(1);

            let startNumber = 1;
            if (existingRooms && existingRooms.length > 0) {
                const maxNumber = parseInt(existingRooms[0].room_number) || 0;
                startNumber = maxNumber + 1;

                toast({
                    title: 'Quartos existentes detectados',
                    description: `Criando quartos a partir do número ${startNumber.toString().padStart(2, '0')}`,
                });
            }

            // Get or create default room type
            const { data: roomTypes } = await supabase
                .from('room_types')
                .select('id')
                .eq('property_id', selectedPropertyId)
                .limit(1);

            let roomTypeId: string;

            if (roomTypes && roomTypes.length > 0) {
                roomTypeId = roomTypes[0].id;
            } else {
                // Create default room type
                const { data: newRoomType, error: roomTypeError } = await supabase
                    .from('room_types')
                    .insert({
                        property_id: selectedPropertyId,
                        name: 'Quarto Standard',
                        capacity: 2,
                        daily_rate: 0,
                    })
                    .select()
                    .single();

                if (roomTypeError) throw roomTypeError;
                roomTypeId = newRoomType.id;
            }

            // Bulk create rooms
            const roomsToCreate = Array.from({ length: count }, (_, i) => ({
                property_id: selectedPropertyId,
                room_type_id: roomTypeId,
                room_number: (startNumber + i).toString().padStart(2, '0'),
                status: 'available',
            }));

            const { error: insertError } = await supabase
                .from('rooms')
                .insert(roomsToCreate);

            if (insertError) throw insertError;

            await refetchRooms();

            toast({
                title: 'Quartos criados',
                description: `${count} quartos foram criados com sucesso.`,
            });

            updateOnboarding({ last_step: 3 });
        } catch (error: any) {
            toast({
                title: 'Erro ao criar quartos',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsCreatingRooms(false);
        }
    };

    const handleComplete = () => {
        updateOnboarding({
            completed_at: new Date().toISOString(),
            last_step: 5
        });

        toast({
            title: 'Configuração concluída!',
            description: 'Seu HostConnect está pronto para usar.',
        });
    };

    const handleDismiss = () => {
        updateOnboarding({ dismissed_at: new Date().toISOString() });
        navigate('/');
    };

    if (onboardingLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold">Configuração Inicial</h1>
                    <span className="text-sm text-muted-foreground">Passo {currentStep} de {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Step 1: Mode Selection */}
            {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Qual tipo de operação você tem?</CardTitle>
                        <CardDescription>Escolha a opção que melhor descreve seu negócio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                variant={selectedMode === 'simple' ? 'default' : 'outline'}
                                className="h-auto flex-col p-6 gap-3"
                                onClick={() => handleModeSelect('simple')}
                            >
                                <Home className="h-12 w-12" />
                                <div className="text-center">
                                    <div className="font-bold">SIMPLIFIED</div>
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">1-5 quartos</div>
                                    <div className="text-[10px] mt-1 text-muted-foreground leading-tight">Ideal para pousadas operadas pelo dono.</div>
                                </div>
                            </Button>

                            <Button
                                variant={selectedMode === 'standard' ? 'default' : 'outline'}
                                className="h-auto flex-col p-6 gap-3"
                                onClick={() => handleModeSelect('standard')}
                            >
                                <Building2 className="h-12 w-12" />
                                <div className="text-center">
                                    <div className="font-bold">STANDARD</div>
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">6-30 quartos</div>
                                    <div className="text-[10px] mt-1 text-muted-foreground leading-tight">Para pequenas pousadas com equipe reduzida.</div>
                                </div>
                            </Button>

                            <Button
                                variant={selectedMode === 'hotel' ? 'default' : 'outline'}
                                className="h-auto flex-col p-6 gap-3"
                                onClick={() => handleModeSelect('hotel')}
                            >
                                <Hotel className="h-12 w-12" />
                                <div className="text-center">
                                    <div className="font-bold">FULL</div>
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">30+ quartos</div>
                                    <div className="text-[10px] mt-1 text-muted-foreground leading-tight">Operação completa para hotéis de médio porte.</div>
                                </div>
                            </Button>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={handleDismiss}>
                                Agora não
                            </Button>
                            <Button onClick={handleNext} disabled={!selectedMode}>
                                Continuar <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Property */}
            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configure sua propriedade</CardTitle>
                        <CardDescription>Informações básicas sobre seu estabelecimento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {properties && properties.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-sm">Você já tem propriedades cadastradas. Selecione uma ou crie uma nova:</p>
                                <div className="grid gap-2">
                                    {properties.map((prop) => (
                                        <Button
                                            key={prop.id}
                                            variant={selectedPropertyId === prop.id ? 'default' : 'outline'}
                                            className="justify-start"
                                            onClick={() => {
                                                setSelectedPropertyId(prop.id);
                                                updateOnboarding({ property_id: prop.id });
                                            }}
                                        >
                                            <Check className={`mr-2 h-4 w-4 ${selectedPropertyId === prop.id ? 'opacity-100' : 'opacity-0'}`} />
                                            {prop.name} - {prop.city}, {prop.state}
                                        </Button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Ou criar nova</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="name">Nome da propriedade *</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Pousada Mar Azul"
                                    value={propertyName}
                                    onChange={(e) => setPropertyName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="city">Cidade *</Label>
                                    <Input
                                        id="city"
                                        placeholder="Ex: Guarujá"
                                        value={propertyCity}
                                        onChange={(e) => setPropertyCity(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">Estado *</Label>
                                    <Input
                                        id="state"
                                        placeholder="Ex: SP"
                                        value={propertyState}
                                        onChange={(e) => setPropertyState(e.target.value)}
                                    />
                                </div>
                            </div>

                            {propertyName && propertyCity && propertyState && (
                                <Button onClick={handleCreateProperty} className="w-full">
                                    Criar Propriedade
                                </Button>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                            </Button>
                            <Button onClick={handleNext} disabled={!selectedPropertyId}>
                                Continuar <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Rooms Template */}
            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quantos quartos você tem?</CardTitle>
                        <CardDescription>Vamos criar seus quartos rapidamente</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1, 5, 10, 30].map((count) => (
                                <Button
                                    key={count}
                                    variant={roomCount === count ? 'default' : 'outline'}
                                    onClick={() => setRoomCount(count)}
                                    className="h-20"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{count}</div>
                                        <div className="text-xs">{count === 1 ? 'quarto' : 'quartos'}</div>
                                    </div>
                                </Button>
                            ))}
                        </div>

                        <div>
                            <Label htmlFor="custom-count">Ou digite a quantidade:</Label>
                            <Input
                                id="custom-count"
                                type="number"
                                min="1"
                                max="200"
                                value={roomCount}
                                onChange={(e) => setRoomCount(parseInt(e.target.value) || 1)}
                            />
                        </div>

                        <Button
                            onClick={() => handleBulkCreateRooms(roomCount)}
                            disabled={isCreatingRooms || !selectedPropertyId}
                            className="w-full"
                            size="lg"
                        >
                            {isCreatingRooms && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar {roomCount} {roomCount === 1 ? 'Quarto' : 'Quartos'}
                        </Button>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                            </Button>
                            <Button onClick={handleNext}>
                                Continuar <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Team Invites (Placeholder) */}
            {currentStep === 4 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Convide sua equipe</CardTitle>
                        <CardDescription>Adicione membros da sua equipe (em breve)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Funcionalidade de convites em desenvolvimento</p>
                            <p className="text-sm mt-2">Você poderá gerenciar sua equipe em breve</p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                            </Button>
                            <Button onClick={handleNext}>
                                Pular <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Completion */}
            {currentStep === 5 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tudo pronto! 🎉</CardTitle>
                        <CardDescription>Seu HostConnect está configurado e pronto para usar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted rounded-lg p-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-600" />
                                <span>Modo de operação configurado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-600" />
                                <span>Propriedade criada</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-600" />
                                <span>Quartos configurados</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            <Button
                                onClick={() => {
                                    handleComplete();
                                    navigate('/front-desk');
                                }}
                                className="w-full"
                                size="lg"
                            >
                                Ir para a Recepção
                            </Button>
                            <Button
                                onClick={() => {
                                    handleComplete();
                                    navigate('/operation/housekeeping');
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Ir para Governança
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SetupWizardPage;
