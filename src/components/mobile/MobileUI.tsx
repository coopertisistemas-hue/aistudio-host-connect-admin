import React from "react";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CardContainer: Base wrapper for standard mobile cards
 */
export const CardContainer: React.FC<{
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}> = ({ children, className, noPadding }) => (
    <div className={cn(
        "bg-white rounded-[22px] border border-neutral-100/80 shadow-sm overflow-hidden",
        !noPadding && "p-4",
        className
    )}>
        {children}
    </div>
);

/**
 * SectionTitleRow: Standard header for content sections
 */
export const SectionTitleRow: React.FC<{
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}> = ({ title, actionLabel, onAction }) => (
    <div className="flex items-center justify-between px-5 mb-4 mt-8 first:mt-2">
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{title}</h2>
        {actionLabel && (
            <button onClick={onAction} className="text-xs font-bold text-primary">
                {actionLabel}
            </button>
        )}
    </div>
);

/**
 * KpiGrid: 2-column grid for overview stats
 */
export const KpiGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-2 gap-3 px-5">
        {children}
    </div>
);

export const KpiCard: React.FC<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: string
}> = ({ label, value, icon: Icon, color = "bg-primary" }) => (
    <CardContainer className="flex flex-col gap-1 py-4 justify-between border-none">
        <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight line-clamp-1">{label}</span>
            {Icon && <Icon className="h-3 w-3 text-neutral-300" />}
        </div>
        <div className="text-2xl font-bold text-[#1A1C1E]">{value}</div>
    </CardContainer>
);

/**
 * QuickAccessCard: Large action card for main modules
 */
export const QuickAccessCard: React.FC<{
    title: string;
    subtitle: string;
    icon: LucideIcon;
    iconColor?: string;
    onClick: () => void;
    badge?: string | number;
}> = ({ title, subtitle, icon: Icon, iconColor = "text-primary", onClick, badge }) => (
    <CardContainer className="px-5 py-4 mb-3 border-none flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.02)]" noPadding>
        <div onClick={onClick} className="flex flex-1 items-center gap-4 p-5">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 bg-neutral-50")}>
                <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-[#1A1C1E] mb-0.5">{title}</h3>
                <p className="text-[13px] text-neutral-500 line-clamp-1">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
                {badge && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {badge}
                    </span>
                )}
                <ChevronRight className="h-4 w-4 text-neutral-300" />
            </div>
        </div>
    </CardContainer>
);

/**
 * PrimaryBottomCTA: Standard absolute bottom button container
 */
export const PrimaryBottomCTA: React.FC<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
}> = ({ label, onClick, disabled, loading }) => (
    <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 flex flex-col items-center pointer-events-none">
        <Button
            className="w-full h-14 rounded-2xl text-[15px] font-bold shadow-lg shadow-primary/10 pointer-events-auto active:scale-[0.98] transition-all"
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? "Processando..." : label}
        </Button>
    </div>
);
