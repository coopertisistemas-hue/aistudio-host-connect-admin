import { ReactNode } from "react";
import DashboardLayout from "./DashboardLayout";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

interface OperationPageTemplateProps {
    title: string;
    subtitle?: string;
    headerIcon?: ReactNode;
    headerActions?: ReactNode;
    kpiSection?: ReactNode;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filtersSection?: ReactNode;
    children: ReactNode;
}

export const OperationPageTemplate = ({
    title,
    subtitle,
    headerIcon,
    headerActions,
    kpiSection,
    searchPlaceholder = "Buscar...",
    searchValue,
    onSearchChange,
    filtersSection,
    children
}: OperationPageTemplateProps) => {
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto pb-10">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                    <div className="flex items-center gap-3">
                        {headerIcon && <div className="p-2 bg-primary/10 rounded-lg">{headerIcon}</div>}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                        </div>
                    </div>
                    {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
                </div>

                {/* KPIs */}
                {kpiSection && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {kpiSection}
                    </div>
                )}

                {/* Search and Filters */}
                <div className="space-y-4">
                    {onSearchChange && (
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                className="pl-10 h-11 bg-card border-none shadow-sm"
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    )}
                    {filtersSection && (
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {filtersSection}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="px-0.5">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
};
