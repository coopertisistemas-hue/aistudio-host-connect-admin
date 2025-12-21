import { ReactNode } from "react";
import DashboardLayout from "./DashboardLayout";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";

interface EntityDetailTemplateProps {
    title: string;
    subtitle?: string;
    badge?: ReactNode;
    backUrl: string;
    headerIcon?: ReactNode;
    headerTitle?: string;
    actionsSection?: ReactNode;
    children: ReactNode;
}

export const EntityDetailTemplate = ({
    title,
    subtitle,
    badge,
    backUrl,
    headerIcon,
    headerTitle,
    actionsSection,
    children
}: EntityDetailTemplateProps) => {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6 pb-20">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 -ml-2 text-muted-foreground"
                    onClick={() => navigate(backUrl)}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>

                {/* Header Card */}
                <Card className="overflow-hidden border-none shadow-sm">
                    <div className="bg-primary/5 p-6 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            {headerIcon && (
                                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                    {headerIcon}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold truncate">{title}</h1>
                                {(subtitle || headerTitle) && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        {headerTitle || subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        {badge && <div className="flex-shrink-0">{badge}</div>}
                    </div>
                </Card>

                {/* Action Grid Section */}
                {actionsSection && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Ações Disponíveis</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {actionsSection}
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
};
