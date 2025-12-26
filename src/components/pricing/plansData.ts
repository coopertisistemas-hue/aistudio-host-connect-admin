
export interface Plan {
    id: string;
    name: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    highlight: boolean;
    cta: string;
}

export const PLANS: Plan[] = [
    {
        id: 'basic',
        name: 'Start',
        description: 'Para quem está começando.',
        price: 'Grátis',
        period: '',
        features: [
            'Até 2 acomodações',
            'Motor de Reservas Básico',
            'Calendário Unificado',
            'Taxa de 3% por reserva',
            'Suporte por email'
        ],
        highlight: false,
        cta: 'Começar Grátis'
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Para anfitriões profissionais.',
        price: 'R$ 49',
        period: '/mês',
        features: [
            'Até 10 acomodações',
            'Channel Manager Completo',
            'Gestão Financeira',
            'Taxa de 1% por reserva',
            'Suporte via Chat'
        ],
        highlight: false,
        cta: 'Assinar Pro'
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'E-commerce e gestão completa.',
        price: 'R$ 199',
        period: '/mês',
        features: [
            'Até 100 acomodações',
            'E-commerce Integrado',
            'Integração Google Meu Negócio',
            'Site Bônus Personalizado',
            'Concierge IA (BYO Key)',
            'Taxa Zero'
        ],
        highlight: false,
        cta: 'Falar com Consultor'
    },
    {
        id: 'founder',
        name: 'Founder Program',
        description: 'Oferta exclusiva de lançamento.',
        price: 'R$ 100',
        period: '/mês (12x)',
        features: [
            'Tudo do plano Premium',
            'Desconto vitalício garantido',
            'Onboarding Dedicado',
            'Acesso antecipado a features',
            'Grupo exclusivo de Founders',
            'Vagas Limitadas: 50'
        ],
        highlight: true,
        cta: 'Garantir Vaga Founder'
    }
];
