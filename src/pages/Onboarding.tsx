import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, Hotel, BedDouble, CheckCircle2, ArrowRight, ArrowLeft, Tent, Palmtree, Box } from "lucide-react";
import { AiConfigWarning } from "@/components/AiConfigWarning";

export default function Onboarding() {
    const { user } = useAuth();
    const { maxAccommodations, canAccess, isLoading: entitlementsLoading } = useEntitlements();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [cepLoading, setCepLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const totalSteps = 4;


    const safeMaxAccommodations = entitlementsLoading ? 100 : (maxAccommodations || 1);

    // State to track if address fields were auto-filled (to lock/unlock inputs individually)
    const [lockedFields, setLockedFields] = useState<string[]>([]);



    const [formData, setFormData] = useState({
        type: "",
        propertyName: "",
        contactPhone: "",
        whatsapp: "",
        zipCode: "",
        address: "",
        number: "",
        noNumber: false,
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        accommodations: [] as string[],
        integrations: {
            otas: false,
            gmb: false,
            ai: false
        }
    });

    // Helper: Phone Mask (XX) XXXXX-XXXX
    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, "")
            .replace(/^(\d{2})(\d)/g, "($1) $2")
            .replace(/(\d)(\d{4})$/, "$1-$2")
            .slice(0, 15);
    };

    // Helper: CEP Mask 00000-000
    const maskCep = (value: string) => {
        return value
            .replace(/\D/g, "")
            .replace(/^(\d{5})(\d)/, "$1-$2")
            .slice(0, 9);
    };

    // Fetch Address from ViaCEP
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, "");
        if (cep.length === 8) {
            setCepLoading(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro || "",
                        neighborhood: data.bairro || "",
                        city: data.localidade || "",
                        state: data.uf || "",
                    }));

                    // Determine which fields should be locked (only non-empty ones)
                    const newLockedFields = [];
                    if (data.logradouro) newLockedFields.push("address");
                    if (data.bairro) newLockedFields.push("neighborhood");
                    if (data.localidade) newLockedFields.push("city");
                    if (data.uf) newLockedFields.push("state");

                    setLockedFields(newLockedFields);

                    // Focus on Number field
                    document.getElementById("address-number")?.focus();
                } else {
                    toast({
                        title: "CEP não encontrado",
                        description: "Por favor, preencha o endereço manualmente.",
                        variant: "destructive"
                    });
                    setLockedFields([]); // Unlock all for manual entry
                }
            } catch (error) {
                console.error("CEP fetch error:", error);
                // On error, unlock all
                setLockedFields([]);
            } finally {
                setCepLoading(false);
            }
        }
    };

    const propertyTypes = [
        { id: "hotel", label: "Hotel", icon: Hotel },
        { id: "pousada", label: "Pousada", icon: Building2 },
        { id: "vacation_rental", label: "Casa de Temporada", icon: Home },
        { id: "hostel", label: "Hostel", icon: BedDouble },
        { id: "chale", label: "Chalés", icon: Tent },
        { id: "alternative", label: "Pousada Alternativa", icon: Palmtree },
        { id: "other", label: "Outros", icon: Box },
    ];

    const handleNext = async () => {
        console.log("handleNext Clicked", { step, totalSteps, formData });
        if (step < totalSteps) {
            console.log("Advancing to next step");
            setStep(step + 1);
            // Save progress to profile
            if (user) {
                try {
                    await supabase
                        .from('profiles')
                        .update({
                            onboarding_step: step + 1,
                            onboarding_type: formData.type || null
                        })
                        .eq('id', user.id);
                } catch (e) {
                    console.error("Error saving progress:", e);
                }
            }
        } else {
            console.log("Finishing onboarding");
            finishOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const finishOnboarding = async () => {
        setSubmitting(true);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("A operação demorou muito. Verifique sua conexão.")), 15000)
        );

        try {
            if (!user) {
                throw new Error("Usuário não autenticado.");
            }

            // 1. Update Profile Status (First critical step)
            // We split this to ensure at least the status is saved.
            toast({ title: "Salvando perfil...", description: "Atualizando status da conta." });

            const profileUpdatePromise = supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_step: totalSteps,
                    // We DO NOT update phone here to avoid unique constraint locks blocking the flow
                })
                .eq('id', user.id);

            const { error: profileError } = await Promise.race([profileUpdatePromise, timeoutPromise]) as any;

            if (profileError) {
                console.error("Profile Status Error", profileError);
                throw new Error("Erro ao atualizar status do perfil: " + profileError.message);
            }

            // 1.5 Try update extra profile data (Non-critical)
            if (formData.whatsapp || formData.contactPhone) {
                const { error: phoneError } = await supabase
                    .from('profiles')
                    .update({
                        phone: formData.whatsapp || formData.contactPhone
                    })
                    .eq('id', user.id);

                if (phoneError) {
                    console.warn("Phone update failed (non-blocking):", phoneError);
                    // We do not throw here, as the user can update this later.
                }
            }

            // 2. Insert Properties
            if (formData.accommodations.length > 0) {
                toast({ title: "Criando acomodações...", description: `Registrando ${formData.accommodations.length} unidades.` });

                for (const accName of formData.accommodations) {
                    const insertPromise = supabase
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

                    const { error: propError } = await Promise.race([insertPromise, timeoutPromise]) as any;

                    if (propError) {
                        // Check for our custom trigger error code P0001
                        if (propError.code === 'P0001' || propError.message.includes('Limite de acomodações atingido')) {
                            throw new Error(propError.message);
                        }
                        console.error("Property Error", propError);
                        throw new Error(`Erro ao criar unidade '${accName}': ${propError.message}`);
                    }
                }
            }

            // 3. Update Auth Metadata (Sync)
            await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });

            toast({
                title: "Configuração concluída!",
                description: "Redirecionando para o painel...",
            });

            // Force redirect
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1000);

        } catch (error: any) {
            console.error("Onboarding Error:", error);

            toast({
                title: "Erro ao salvar",
                description: error.message || "Ocorreu um erro desconhecido.",
                variant: "destructive"
            });
            setSubmitting(false);
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
                                className="grid grid-cols-2 md:grid-cols-3 gap-4"
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
                                            onChange={(e) => setFormData({ ...formData, contactPhone: maskPhone(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>WhatsApp <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>CEP <span className="text-red-500">*</span></Label>
                                    <Input
                                        placeholder="00000-000"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: maskCep(e.target.value) })}
                                        onBlur={handleCepBlur}
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3 space-y-2">
                                        <Label>Endereço / Rua <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Rua das Flores"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            disabled={lockedFields.includes("address")}
                                        />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <Label>Número <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="address-number"
                                            placeholder="123"
                                            value={formData.noNumber ? "S/N" : formData.number}
                                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                            disabled={formData.noNumber}
                                            className={formData.noNumber ? "opacity-50" : ""}
                                        />
                                        <div className="flex items-center space-x-2 pt-1">
                                            <Checkbox
                                                id="no-number"
                                                checked={formData.noNumber}
                                                onCheckedChange={(checked) => setFormData(prev => ({
                                                    ...prev,
                                                    noNumber: checked as boolean,
                                                    number: checked ? "" : prev.number
                                                }))}
                                            />
                                            <Label htmlFor="no-number" className="text-xs text-muted-foreground font-normal cursor-pointer whitespace-nowrap">Sem número</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bairro</Label>
                                        <Input
                                            placeholder="Centro"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            disabled={lockedFields.includes("neighborhood")}
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
                                            disabled={lockedFields.includes("city")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Ex: SC"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            disabled={lockedFields.includes("state")}
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

                    <Button onClick={handleNext} disabled={
                        submitting ||
                        (step === 1 && !formData.type) ||
                        (step === 2 && (
                            !formData.propertyName.trim() ||
                            !formData.whatsapp.trim() ||
                            !formData.zipCode.trim() ||
                            !formData.address.trim() ||
                            (!formData.number.trim() && !formData.noNumber) ||
                            !formData.city.trim() ||
                            !formData.state.trim()
                        ))
                    }>
                        {step === totalSteps ? (submitting ? 'Concluindo...' : 'Concluir Setup') : 'Próximo'}
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
