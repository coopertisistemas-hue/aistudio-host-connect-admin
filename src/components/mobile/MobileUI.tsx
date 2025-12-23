import React from "react";
import { ChevronRight, LucideIcon, AlertCircle, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * CardContainer: Base wrapper for standard mobile cards
 */
/**
 * CardContainer: Base wrapper for standard mobile cards
 */
export const CardContainer: React.FC<React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}> = ({ children, className, noPadding, ...props }) => (
    <div className={cn(
        "bg-[var(--ui-surface-card)] rounded-[var(--ui-radius-card)] border border-[var(--ui-color-border)] shadow-[var(--ui-shadow-soft)] overflow-hidden",
        !noPadding && "p-5",
        className
    )} {...props}>
        {children}
    </div>
);

/**
 * HeroSection: Date and Shift display (Compact/Premium)
 */
export const HeroSection: React.FC = () => {
    const today = new Date();
    // Format: "SEG, 23 DEZ"
    const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase().replace('.', '');
    const hour = today.getHours();

    let shift = '';
    if (hour >= 6 && hour < 14) shift = 'MANHÃ';
    else if (hour >= 14 && hour < 22) shift = 'TARDE';
    else shift = 'NOITE';

    return (
        <div className="mb-3 pt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400/80 tracking-widest uppercase">
                <Calendar className="h-3 w-3 opacity-60" />
                <span>{dateStr}</span>
                <span className="opacity-20">•</span>
                <span className="text-emerald-600/90 flex items-center gap-1.5">
                    {shift}
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                </span>
            </div>
        </div>
    );
};

/**
 * SectionTitleRow: Standard header for content sections
 */
export const SectionTitleRow: React.FC<{
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    rightElement?: React.ReactNode;
}> = ({ title, actionLabel, onAction, rightElement }) => (
    <div className="flex items-center justify-between mb-4 mt-[var(--ui-spacing-section,20px)] first:mt-2">
        <h2 className="text-[14px] font-bold text-[var(--ui-color-text-muted)] uppercase tracking-[0.1em]">{title}</h2>
        {rightElement}
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
    <div className="grid grid-cols-2 gap-3.5">
        {children}
    </div>
);

export const KpiCard: React.FC<{
    label: string;
    value: string | number;
    unit?: string;
    icon?: LucideIcon;
}> = ({ label, value, unit }) => (
    <CardContainer className="flex flex-col gap-2 p-5 border-none shadow-none bg-neutral-50/50">
        <span className="text-[11px] font-medium text-[var(--ui-color-text-muted)] opacity-70 uppercase tracking-tight">{label}</span>
        <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[var(--ui-color-text-main)] tracking-tight">{value}</span>
            {unit && <span className="text-[11px] font-bold text-[var(--ui-color-text-muted)] opacity-40 uppercase">{unit}</span>}
        </div>
    </CardContainer>
);

/**
 * ListRow: Premium navigation row for grouped lists
 */
export const ListRow: React.FC<{
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    onClick?: () => void;
    badge?: string | number;
    showChevron?: boolean;
    isLast?: boolean;
}> = ({ title, subtitle, icon: Icon, iconColor = "text-primary", onClick, badge, showChevron = true, isLast }) => (
    <div
        onClick={onClick}
        className={cn(
            "flex items-center gap-4 py-[14px] px-5 active:bg-neutral-50 transition-colors cursor-pointer",
            !isLast && "border-b border-[var(--ui-color-border)]"
        )}
    >
        {Icon && (
            <div className={cn("h-11 w-11 rounded-[var(--ui-radius-button)] flex items-center justify-center shrink-0 bg-[var(--ui-surface-neutral)]")}>
                <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-[var(--ui-color-text-main)] leading-tight">{title}</h3>
            {subtitle && <p className="text-[13px] text-[var(--ui-color-text-muted)] line-clamp-1 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
            {badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                    {badge}
                </span>
            )}
            {showChevron && <ChevronRight className="h-4 w-4 text-neutral-300" />}
        </div>
    </div>
);

/**
 * QuickAccessCard: Large individual card for main modules (Delivery Connect Pattern)
 */
/**
 * QuickAccessCard: Large individual card for main modules (Delivery Connect Pattern)
 */
export const QuickAccessCard: React.FC<{
    title: string;
    subtitle: string;
    icon: LucideIcon;
    iconColor?: string;
    onClick: () => void;
    badge?: string | number;
}> = ({ title, subtitle, icon: Icon, iconColor = "text-primary", onClick, badge }) => (
    <CardContainer
        className="shadow-[var(--ui-shadow-soft)] active:scale-[0.98] transition-all cursor-pointer border-[var(--ui-color-border)]/50"
        noPadding
    >
        <div onClick={onClick} className="flex items-center gap-4 p-5">
            <div className={cn("h-12 w-12 rounded-[var(--ui-radius-button)] flex items-center justify-center shrink-0 bg-[var(--ui-surface-neutral)]/80")}>
                <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-[var(--ui-color-text-main)] mb-0.5 leading-tight">{title}</h3>
                <p className="text-[13px] text-[var(--ui-color-text-muted)] line-clamp-1">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
                {badge !== undefined && (
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {badge}
                    </span>
                )}
                <ChevronRight className="h-4 w-4 text-neutral-300" />
            </div>
        </div>
    </CardContainer>
);

/**
 * CompactAccessCard: Optimized for 2-column grid layout
 */
export const CompactAccessCard: React.FC<{
    title: string;
    subtitle: string;
    icon: LucideIcon;
    iconColor?: string;
    onClick: () => void;
    badge?: string | number;
}> = ({ title, subtitle, icon: Icon, iconColor = "text-primary", onClick, badge }) => (
    <CardContainer
        className="shadow-sm active:scale-[0.98] transition-all cursor-pointer border-[var(--ui-color-border)] hover:border-primary/20 bg-white group relative h-full"
        noPadding
    >
        <div onClick={onClick} className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-neutral-50 group-hover:bg-primary/5 transition-colors")}>
                    <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                {badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[9px] border border-emerald-100">
                        {badge}
                    </span>
                )}
            </div>

            <div className="mt-auto">
                <h3 className="text-[13px] font-bold text-[var(--ui-color-text-main)] leading-tight mb-1 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-[11px] text-[var(--ui-color-text-muted)] line-clamp-1 leading-normal opacity-80">
                    {subtitle}
                </p>
            </div>
        </div>
    </CardContainer>
);

/**
 * GlassAccessCard: Premium Glassmorphism card for Quick Access Grid
 */
export const GlassAccessCard: React.FC<{
    title: string;
    subtitle: string;
    icon: LucideIcon;
    iconColor?: string;
    onClick: () => void;
    badge?: string | number;
}> = ({ title, subtitle, icon: Icon, iconColor = "text-primary", onClick, badge }) => (
    <div
        onClick={onClick}
        className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-lg transition-all active:scale-[0.98] cursor-pointer hover:bg-white/70 h-full p-4 flex flex-col justify-between"
    >
        {/* Glow effect on hover */}
        <div className="absolute -inset-[100%] top-0 block h-[200%] w-[100%] -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-0 transition-opacity group-hover:opacity-20 translate-x-32 duration-700" />

        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-white/50 dark:bg-white/10 shadow-sm backdrop-blur-sm border border-white/50",
                "group-hover:scale-110 transition-transform duration-300"
            )}>
                <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            {badge !== undefined && (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold border shadow-sm backdrop-blur-md",
                    typeof badge === 'number' || (typeof badge === 'string' && /^\d+$/.test(badge))
                        ? "bg-rose-500/90 text-white border-rose-400"
                        : "bg-emerald-500/90 text-white border-emerald-400"
                )}>
                    {badge}
                </span>
            )}
        </div>

        <div className="relative z-10">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">
                {title}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 leading-normal font-medium">
                {subtitle}
            </p>
        </div>
    </div>
);

/**
 * PremiumSkeleton: Pulser for loading states
 */
export const PremiumSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("bg-neutral-200/50 animate-pulse rounded-xl backdrop-blur-sm", className)} />
);

/**
 * ErrorState: Human-friendly error display
 */
export const ErrorState: React.FC<{
    title?: string;
    message: string;
    onRetry?: () => void;
}> = ({ title = "Opa, algo deu errado", message, onRetry }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[40vh]">
        <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-[var(--ui-color-text-main)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--ui-color-text-muted)] mb-6 max-w-[240px]">{message}</p>
        {onRetry && (
            <Button variant="outline" onClick={onRetry} className="rounded-xl font-bold">
                Tentar Novamente
            </Button>
        )}
    </div>
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
    <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[var(--ui-surface-bg)] via-[var(--ui-surface-bg)]/95 to-transparent pt-10 flex flex-col items-center pointer-events-none">
        <Button
            className="w-full h-14 rounded-[var(--ui-radius-button)] text-[15px] font-bold shadow-lg shadow-primary/10 pointer-events-auto active:scale-[0.98] transition-all"
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? "Processando..." : label}
        </Button>
    </div>
);
