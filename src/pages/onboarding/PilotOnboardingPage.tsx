import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { usePilotOnboarding } from '@/hooks/usePilotOnboarding';
import { useToast } from '@/hooks/use-toast';
import { setPropertyFeatureFlagOverrides } from '@/lib/featureFlags';
import {
  getOperationalProfilePresets,
  type AttributeTag,
  type LodgingType,
  type OperationalProfile,
  type PilotOnboardingConfig,
} from '@/lib/pilotOnboarding';

type Screen =
  | 'welcome'
  | 'profile'
  | 'lodging'
  | 'attributes'
  | 'confirmation'
  | 'done';

const TOTAL_STEPS = 4;

const operationalProfiles: {
  value: OperationalProfile;
  description: string;
}[] = [
  {
    value: 'Operação Completa',
    description:
      'Recepção dedicada, governança estruturada e manutenção recorrente.\nIndicada para hotéis, pousadas médias e hostels.',
  },
  {
    value: 'Operação Enxuta',
    description:
      'Equipe reduzida, dono participando da operação e fluxos simples.\nIndicada para pousadas pequenas, chalés, cabanas e lofts.',
  },
  {
    value: 'Operação Simplificada',
    description:
      'Poucos fluxos, limpeza eventual e foco em controle básico.\nIndicada para casas de temporada, hospedagem rural e operações alternativas.',
  },
];

const lodgingTypes: LodgingType[] = [
  'Hotel',
  'Pousada',
  'Hostel',
  'Casa de temporada',
  'Chalé / Cabana',
  'Lodge',
  'Camping / Glamping',
  'Eco pousada / Eco village',
  'Hospedagem rural / Fazenda',
  'Loft',
];

const attributeOptions: AttributeTag[] = [
  'Boutique',
  'Eco / Sustentável',
  'Rural',
  'Glamping',
  'Pet friendly',
  'Auto check-in',
  'Familiar',
  'Adult only',
];

const PilotOnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedPropertyId, config, isComplete, isLoading, saveConfig } =
    usePilotOnboarding();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [operationalProfile, setOperationalProfile] =
    useState<OperationalProfile | null>(null);
  const [lodgingType, setLodgingType] = useState<LodgingType | null>(null);
  const [attributes, setAttributes] = useState<AttributeTag[]>([]);

  useEffect(() => {
    if (!config) return;
    setOperationalProfile(config.operationalProfile ?? null);
    setLodgingType(config.lodgingType ?? null);
    setAttributes(config.attributes ?? []);
  }, [config]);

  useEffect(() => {
    if (!isComplete) return;
    if (screen === 'done') return;
    navigate('/dashboard', { replace: true });
  }, [isComplete, navigate, screen]);

  const stepIndex = useMemo(() => {
    if (screen === 'profile') return 1;
    if (screen === 'lodging') return 2;
    if (screen === 'attributes') return 3;
    if (screen === 'confirmation') return 4;
    return null;
  }, [screen]);

  const handleContinue = () => {
    if (screen === 'welcome') setScreen('profile');
    if (screen === 'profile') setScreen('lodging');
    if (screen === 'lodging') setScreen('attributes');
    if (screen === 'attributes') setScreen('confirmation');
  };

  const handleBack = () => {
    if (screen === 'profile') setScreen('welcome');
    if (screen === 'lodging') setScreen('profile');
    if (screen === 'attributes') setScreen('lodging');
    if (screen === 'confirmation') setScreen('attributes');
  };

  const toggleAttribute = (value: AttributeTag) => {
    setAttributes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleComplete = () => {
    if (!selectedPropertyId || !operationalProfile || !lodgingType) {
      toast({
        title: 'Complete as etapas anteriores',
        description: 'Revise as informações antes de concluir.',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const nextConfig: PilotOnboardingConfig = {
      operationalProfile,
      lodgingType,
      attributes,
      completedAt: now,
      updatedAt: now,
    };

    saveConfig(nextConfig);
    setPropertyFeatureFlagOverrides(
      selectedPropertyId,
      getOperationalProfilePresets(operationalProfile)
    );
    setScreen('done');
  };

  const canContinue = useMemo(() => {
    if (screen === 'profile') return !!operationalProfile;
    if (screen === 'lodging') return !!lodgingType;
    return true;
  }, [lodgingType, operationalProfile, screen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!selectedPropertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configuração inicial pendente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione uma propriedade para continuar a configuração inicial.
            </p>
            <Button className="w-full" onClick={() => navigate('/properties')}>
              Ir para propriedades
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ui-surface-bg)] px-4 py-8">
      <div className="mx-auto w-full max-w-xl space-y-6">
        {stepIndex && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Passo {stepIndex} de {TOTAL_STEPS}</span>
          </div>
        )}

        {screen === 'welcome' && (
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo ao Host Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Vamos configurar sua hospedagem em poucos passos.
                Essa configuração inicial define como o sistema vai funcionar no dia a dia — e você poderá ajustar tudo depois.
              </p>
              <Button className="w-full" onClick={handleContinue}>
                Começar configuração
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Como funciona a sua operação?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Escolha a opção que mais se aproxima da rotina atual da sua hospedagem.
                Isso ajuda o sistema a ativar apenas o que faz sentido para você.
              </p>
              <div className="space-y-3">
                {operationalProfiles.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      operationalProfile === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted bg-background'
                    }`}
                    onClick={() => setOperationalProfile(option.value)}
                  >
                    <div className="font-semibold text-sm mb-2">
                      {option.value}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Você poderá alterar essa configuração depois.</p>
              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={handleBack}>
                  Voltar
                </Button>
                <Button onClick={handleContinue} disabled={!canContinue}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {screen === 'lodging' && (
          <Card>
            <CardHeader>
              <CardTitle>Qual é o tipo principal da sua hospedagem?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Essa informação é usada para organização, relatórios e melhorias futuras.
                Ela não muda o funcionamento do sistema agora.
              </p>
              <RadioGroup
                value={lodgingType ?? ''}
                onValueChange={(value) => setLodgingType(value as LodgingType)}
                className="space-y-3"
              >
                {lodgingTypes.map((option) => {
                  const optionId = option
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-');

                  return (
                    <div
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                        lodgingType === option
                          ? 'border-primary bg-primary/5'
                          : 'border-muted'
                      }`}
                    >
                      <RadioGroupItem value={option} id={optionId} />
                      <Label htmlFor={optionId} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={handleBack}>
                  Voltar
                </Button>
                <Button onClick={handleContinue} disabled={!canContinue}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {screen === 'attributes' && (
          <Card>
            <CardHeader>
              <CardTitle>Como você descreve sua hospedagem?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Selecione os atributos que ajudam a descrever o seu negócio.
                Essas informações são apenas descritivas neste momento.
              </p>
              <div className="space-y-3">
                {attributeOptions.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer ${
                      attributes.includes(option)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted'
                    }`}
                  >
                    <Checkbox
                      checked={attributes.includes(option)}
                      onCheckedChange={() => toggleAttribute(option)}
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={handleBack}>
                  Voltar
                </Button>
                <Button onClick={handleContinue}>Continuar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {screen === 'confirmation' && (
          <Card>
            <CardHeader>
              <CardTitle>Tudo certo para começar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Perfil operacional:</span>
                  <span className="font-medium text-right">
                    {operationalProfile ?? 'Não definido'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Tipo de hospedagem:</span>
                  <span className="font-medium text-right">
                    {lodgingType ?? 'Não definido'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Atributos:</span>
                  <span className="font-medium text-right">
                    {attributes.length > 0 ? attributes.join(', ') : 'Nenhum'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Você poderá alterar essas informações depois, conforme sua operação evoluir.
              </p>
              <div className="flex justify-between gap-3">
                <Button variant="ghost" onClick={handleBack}>
                  Voltar
                </Button>
                <Button onClick={handleComplete}>Concluir configuração</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {screen === 'done' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração concluída</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Sua hospedagem já está pronta para uso.
                Agora você pode começar a organizar a operação no dia a dia.
              </p>
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Ir para o painel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PilotOnboardingPage;
