import { MobileShell, MobilePageHeader } from "@/components/mobile/MobileShell";
import { CardContainer } from "@/components/mobile/MobileUI";

const HousekeepingList: React.FC = () => {
    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Governança"
                    subtitle="Fluxo anterior"
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-10">
                <CardContainer className="p-6 border-dashed text-center">
                    <p className="text-sm font-semibold text-neutral-700">Em breve</p>
                    <p className="text-xs text-neutral-500 mt-2">
                        Este fluxo está indisponível durante o piloto.
                    </p>
                </CardContainer>
            </div>
        </MobileShell>
    );
};

export default HousekeepingList;
