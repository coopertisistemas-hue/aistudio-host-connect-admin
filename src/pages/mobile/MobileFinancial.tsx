import React from "react";
import { Wallet, Filter } from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import { Button } from "@/components/ui/button";

const MobileFinancial: React.FC = () => {
    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Financeiro"
                    subtitle="Caixa do dia e fechamentos"
                    rightAction={
                        <Button variant="ghost" size="icon" className="bg-white shadow-sm border border-neutral-100 rounded-xl">
                            <Filter className="h-4 w-4 text-neutral-500" />
                        </Button>
                    }
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="h-20 w-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100">
                    <Wallet className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--ui-color-text-main)] mb-2">Caixa equilibrado</h3>
                <p className="text-sm text-[var(--ui-color-text-muted)] max-w-[260px] leading-relaxed">
                    Tudo pronto para os lançamentos financeiros de hoje. O resumo de caixa aparecerá aqui.
                </p>
            </div>
        </MobileShell>
    );
};

export default MobileFinancial;
