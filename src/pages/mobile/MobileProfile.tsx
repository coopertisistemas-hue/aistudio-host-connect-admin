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
    ListRow
} from "@/components/mobile/MobileUI";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const MobileProfile: React.FC = () => {
    const { user, userRole, userPlan, signOut } = useAuth();

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Meu Perfil"
                    subtitle="Gerencie sua conta e preferências"
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-8">
                <CardContainer className="p-8 flex flex-col items-center text-center gap-5 bg-white border-none shadow-[var(--ui-shadow-medium)]">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-[var(--ui-shadow-soft)]">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl uppercase">
                            {user?.user_metadata?.full_name?.slice(0, 2).toUpperCase() || "UN"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-[var(--ui-color-text-main)] tracking-tight">{user?.user_metadata?.full_name || "Usuário"}</h2>
                        <p className="text-sm text-[var(--ui-color-text-muted)]">{user?.email}</p>
                    </div>

                    <div className="flex gap-2.5 mt-1">
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-none bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider">
                            {userRole}
                        </Badge>
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-none bg-[var(--ui-surface-neutral)] text-[var(--ui-color-text-muted)] font-bold text-[10px] uppercase tracking-wider">
                            {userPlan}
                        </Badge>
                    </div>
                </CardContainer>

                <SectionTitleRow title="Configurações" />
                <CardContainer noPadding className="border-none shadow-[var(--ui-shadow-soft)]">
                    <ListRow
                        title="Notificações"
                        subtitle="Alertas de novas reservas e tarefas"
                        icon={Bell}
                        iconColor="text-blue-500"
                        onClick={() => { }}
                    />
                    <ListRow
                        title="Segurança"
                        subtitle="Senhas e autenticação"
                        icon={Shield}
                        iconColor="text-indigo-500"
                        onClick={() => { }}
                        isLast
                    />
                </CardContainer>

                <SectionTitleRow title="Suporte" />
                <CardContainer noPadding className="border-none shadow-[var(--ui-shadow-soft)]">
                    <ListRow
                        title="Ajuda & FAQ"
                        subtitle="Tire suas dúvidas ou fale conosco"
                        icon={HelpCircle}
                        iconColor="text-emerald-500"
                        onClick={() => { }}
                    />
                    <ListRow
                        title="Termos de Uso"
                        subtitle="Políticas e diretrizes"
                        icon={FileText}
                        iconColor="text-neutral-500"
                        onClick={() => { }}
                        isLast
                    />
                </CardContainer>

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
