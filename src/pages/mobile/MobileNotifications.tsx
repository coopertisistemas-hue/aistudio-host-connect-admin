import React from "react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer
} from "@/components/mobile/MobileUI";
import { Bell, Info } from "lucide-react";

/**
 * MobileNotifications: Placeholder page for mobile notification system
 */
const MobileNotifications: React.FC = () => {
    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Notificações"
                    subtitle="Fique por dentro das atualizações"
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-8 mt-10">
                <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[var(--ui-radius-card)] border border-[var(--ui-color-border)] shadow-[var(--ui-shadow-soft)] opacity-80 py-16">
                    <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                        <Bell className="h-10 w-10 text-primary opacity-30" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--ui-color-text-main)] mb-2">Sem notificações</h3>
                    <p className="text-sm text-[var(--ui-color-text-muted)] max-w-[240px]">
                        Tudo limpo por aqui! Você será avisado quando houver novas tarefas ou reservas.
                    </p>
                </div>

                <div className="mt-8 flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-[12px] text-primary/70 font-medium leading-snug">
                        As notificações push podem ser ativadas em breve nas configurações do seu perfil.
                    </p>
                </div>
            </div>
        </MobileShell>
    );
};

export default MobileNotifications;
