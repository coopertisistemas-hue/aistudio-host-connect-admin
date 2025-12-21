import React from "react";
import {
    User,
    LogOut,
    Settings,
    Shield,
    Bell,
    HelpCircle,
    FileText
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow,
    QuickAccessCard
} from "@/components/mobile/MobileUI";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const MobileProfile: React.FC = () => {
    const { user, userRole, userPlan, signOut } = useAuth();

    return (
        <MobileShell>
            <MobilePageHeader
                title="Meu Perfil"
                subtitle="Gerencie sua conta e preferências"
            />

            <div className="px-5 pb-8">
                <CardContainer className="p-6 flex flex-col items-center text-center gap-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl uppercase">
                            {user?.user_metadata?.full_name?.slice(0, 2).toUpperCase() || "UN"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-[#1A1C1E]">{user?.user_metadata?.full_name || "Usuário"}</h2>
                        <p className="text-sm text-neutral-500">{user?.email}</p>
                    </div>

                    <div className="flex gap-2">
                        <Badge variant="outline" className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                            {userRole}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 border-neutral-200">
                            {userPlan}
                        </Badge>
                    </div>
                </CardContainer>

                <SectionTitleRow title="Configurações" />
                <QuickAccessCard
                    title="Notificações"
                    subtitle="Alertas de novas reservas e tarefas"
                    icon={Bell}
                    iconColor="text-blue-500"
                    onClick={() => { }}
                />
                <QuickAccessCard
                    title="Segurança"
                    subtitle="Senhas e autenticação"
                    icon={Shield}
                    iconColor="text-indigo-500"
                    onClick={() => { }}
                />

                <SectionTitleRow title="Suporte" />
                <QuickAccessCard
                    title="Ajuda & FAQ"
                    subtitle="Tire suas dúvidas ou fale conosco"
                    icon={HelpCircle}
                    iconColor="text-emerald-500"
                    onClick={() => { }}
                />
                <QuickAccessCard
                    title="Termos de Uso"
                    subtitle="Políticas e diretrizes"
                    icon={FileText}
                    iconColor="text-neutral-500"
                    onClick={() => { }}
                />

                <div className="mt-8">
                    <button
                        onClick={signOut}
                        className="w-full h-14 rounded-2xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-rose-100"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair da Conta
                    </button>
                </div>
            </div>
        </MobileShell>
    );
};

export default MobileProfile;
