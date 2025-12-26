import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, Hotel, BedDouble, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { AiConfigWarning } from "@/components/AiConfigWarning";

export default function Onboarding() {
    const { user } = useAuth();
    const { maxAccommodations, canAccess, isLoading: entitlementsLoading } = useEntitlements();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const totalSteps = 4;

    // Default safe limit if loading. Allow user to add items freely, backend will validate.
    const safeMaxAccommodations = entitlementsLoading ? 100 : (maxAccommodations || 1);

    const [formData, setFormData] = useState({
        type: "",
        propertyName: "",
        contactPhone: "",
        whatsapp: "", // New
        zipCode: "", // New
        address: "", // Street
        number: "", // New
        complement: "", // New
        neighborhood: "", // New
        city: "",
        state: "",
        accommodations: [] as string[],
        integrations: {
            otas: false,
            gmb: false,
            ai: false
        }
    });

    const propertyTypes = [
        { id: "hotel", label: "Hotel", icon: Hotel },
        { id: "pousada", label: "Pousada", icon: Building2 },
        { id: "vacation_rental", label: "Casa de Temporada", icon: Home },
        { id: "hostel", label: "Hostel", icon: BedDouble },
    ];

    const handleNext = async () => {
        if (step < totalSteps) {
            setStep(step + 1);
            // Save progress to profile
            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        onboarding_step: step + 1,
                        onboarding_type: formData.type || null
                    })
                    .eq('id', user.id);
            }
        } else {
            finishOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const finishOnboarding = async () => {
        setLoading(true);
        try {
            if (!user) return;

            // 1. Update Profile Status
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_step: totalSteps,
                    phone: formData.whatsapp || formData.contactPhone // Update profile phone
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Insert Properties (Real backend limit check will happen here)
            if (formData.accommodations.length > 0) {
                // We insert them one by one to catch the specific trigger error if it happens
                for (const accName of formData.accommodations) {
                    const { error: propError } = await supabase
                        .from('properties')
                        .insert({
                            user_id: user.id,
                            name: accName,
                            address: `${formData.address}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''} - ${formData.neighborhood}, ${formData.zipCode}`,
                            city: formData.city || 'Cidade não informada',
                            state: formData.state || 'UF',
                            status: 'active',
                            total_rooms: 1
                        });

                    if (propError) {
                        // Check for our custom trigger error code P0001
                        if (propError.code === 'P0001' || propError.message.includes('Limite de acomodações atingido')) {
                            throw new Error(propError.message);
                        }
                        throw propError;
                    }
                }
            }

            toast({
                title: "Configuração concluída!",
                description: "Bem-vindo ao seu painel HostConnect.",
            });
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Onboarding Error:", error);
            toast({
                title: "Erro ao salvar",
                description: error.message || "Verifique se você atingiu o limite do seu plano.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // if (entitlementsLoading) return <div className="h-screen flex items-center justify-center">Carregando plano...</div>;

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl mb-8 space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao HostConnect</h1>
                <p className="text-muted-foreground">Vamos configurar sua conta em poucos passos.</p>
            </div>

            <div className="w-full max-w-3xl mb-8">
                <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
                    <span>Tipo de Propriedade</span>
                    <span>Dados Básicos</span>
                    <span>Acomodações</span>
                    <span>Integrações</span>
                </div>
                <Progress value={(step / totalSteps) * 100} className="h-2" />
            </div>

            <Card className="w-full max-w-3xl shadow-lg border-t-4 border-t-primary">
                <CardContent className="pt-8 min-h-[400px]">

                    {/* STEP 1: Property Type */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold">Qual o seu tipo de hospedagem?</h2>
                                <p className="text-muted-foreground">Isso nos ajuda a personalizar sua experiência.</p>
                            </div>
                            <RadioGroup
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {propertyTypes.map((type) => (
                                    <div key={type.id}>
                                        <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                                        <Label
                                            htmlFor={type.id}
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full"
                                        >
                                            <type.icon className="mb-3 h-8 w-8 text-primary" />
                                            <span className="font-semibold">{type.label}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {/* STEP 2: Basic Info */}
                    {step === 2 && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold">Dados da Propriedade</h2>
                            </div>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Nome do Estabelecimento <span className="text-red-500">*</span></Label>
                                    <Input
                                        placeholder="Ex: Pousada Sol & Mar"
                                        value={formData.propertyName}
                                        onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            placeholder="(00) 0000-0000"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>WhatsApp <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>CEP</Label>
                                    <Input
                                        placeholder="00000-000"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3 space-y-2">
                                        <Label>Endereço / Rua <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Rua das Flores"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <Label>Número <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="123"
                                            value={formData.number}
                                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bairro</Label>
                                        <Input
                                            placeholder="Centro"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Complemento</Label>
                                        <Input
                                            placeholder="Ap 101, Bloco B"
                                            value={formData.complement}
                                            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cidade <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Ex: Florianópolis"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Ex: SC"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Accommodations (Limit Check) */}
                    {step === 3 && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold">Quantas acomodações você tem?</h2>
                                <p className="text-muted-foreground">
                                    {entitlementsLoading ? 'Carregando limite...' : <>Seu plano atual permite até <span className="font-bold text-primary">{safeMaxAccommodations}</span> unidades.</>}
                                </p>
                            </div>

                            <div className="bg-secondary/20 p-6 rounded-lg border text-center space-y-4">
                                <h3 className="font-medium">Cadastrar unidades agora</h3>
                                <p className="text-sm text-muted-foreground">Você pode adicionar mais detalhes depois no painel.</p>

                                {/* Mock Counter UI - Now Editable */}
                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setFormData(p => ({
                                            ...p,
                                            accommodations: p.accommodations.slice(0, -1)
                                        }))}
                                        disabled={formData.accommodations.length === 0}
                                    >
                                        -
                                    </Button>

                                    <div className="w-24 text-center">
                                        <Input
                                            type="number"
                                            min="0"
                                            max={safeMaxAccommodations}
                                            className="text-center text-lg font-bold h-12"
                                            value={formData.accommodations.length}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                if (val <= safeMaxAccommodations) {
                                                    // Generate array of length val
                                                    setFormData(p => ({
                                                        ...p,
                                                        accommodations: Array.from({ length: val }, (_, i) => p.accommodations[i] || `Unidade ${i + 1}`)
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            if (formData.accommodations.length < safeMaxAccommodations) {
                                                setFormData(p => ({
                                                    ...p,
                                                    accommodations: [...p.accommodations, `Unidade ${p.accommodations.length + 1}`]
                                                }));
                                            } else {
                                                toast({
                                                    title: "Limite do plano atingido",
                                                    description: "Faça upgrade para adicionar mais unidades.",
                                                    variant: "destructive"
                                                });
                                            }
                                        }}
                                        disabled={formData.accommodations.length >= safeMaxAccommodations}
                                    >
                                        +
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {formData.accommodations.length} de {entitlementsLoading ? '...' : safeMaxAccommodations} slots usados
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Integrations (Gate Check) */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold">Conectar Integrações</h2>
                                <p className="text-muted-foreground">Ative os recursos disponíveis no seu plano.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {/* OTA Card */}
                                <IntegrationCard
                                    title="OTAs (Airbnb, Booking)"
                                    description="Sincronize calendários automaticamente."
                                    active={canAccess('otas')}
                                    icon={Building2}
                                />

                                {/* GMB Card */}
                                <IntegrationCard
                                    title="Google Meu Negócio"
                                    description="Gerencie sua presença no Google."
                                    active={canAccess('gmb')}
                                    icon={ArrowRight}
                                />

                                {/* AI Card */}
                                <IntegrationCard
                                    title="Concierge IA"
                                    description="Atendimento automático (BYO Key)."
                                    active={canAccess('ai_assistant')}
                                    icon={CheckCircle2}
                                />

                                {/* eCommerce Card */}
                                <IntegrationCard
                                    title="Loja Virtual"
                                    description="Venda serviços e produtos extras."
                                    active={canAccess('ecommerce')}
                                    icon={Home}
                                />
                            </div>

                            {/* AI Warning if AI is accessible or just generally informative */}
                            <div className="mt-4">
                                <AiConfigWarning featureName="Concierge IA (OpenAI/Gemini)" />
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>

                    <Button onClick={handleNext} disabled={loading}>
                        {step === totalSteps ? (loading ? 'Concluindo...' : 'Concluir Setup') : 'Próximo'}
                        {step !== totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function IntegrationCard({ title, description, active, icon: Icon }: any) {
    return (
        <div className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${active ? 'bg-card border-primary/20' : 'bg-muted/50 opacity-60'}`}>
            <div className={`p-2 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold">{title}</h4>
                    {!active && <span className="text-[10px] uppercase font-bold bg-muted px-2 py-0.5 rounded">Indisponível</span>}
                    {active && <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Disponível</span>}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
