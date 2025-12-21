import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, LogOut, User, Bell, MapPin, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";

/**
 * MobileShell: The root layout for all mobile-only pages (/m/*)
 */
export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#F8FAF9] pb-safe-offset-20">
            {children}
        </div>
    );
};

/**
 * MobileTopHeader: Main branding and status header for the Home screen
 */
export const MobileTopHeader: React.FC = () => {
    const { user, userRole, signOut } = useAuth();
    const { selectedProperty } = useSelectedProperty();

    return (
        <header className="px-5 pt-8 pb-4 flex items-center justify-between bg-[#F8FAF9]">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Operacional</span>
                </div>
                <h1 className="text-xl font-bold text-[#1A1C1E] tracking-tight truncate max-w-[200px]">
                    {selectedProperty?.name || "Host Connect"}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <Link to="/m/profile">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {user?.user_metadata?.full_name?.slice(0, 2).toUpperCase() || "UN"}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
};

/**
 * MobilePageHeader: Standard header for sub-pages with navigation/actions
 */
export const MobilePageHeader: React.FC<{
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}> = ({ title, subtitle, showBack = true, rightAction }) => {
    const navigate = useNavigate();

    return (
        <header className="px-5 pt-12 pb-6 flex items-center gap-4 bg-[#F8FAF9]">
            {showBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-white shadow-sm border border-neutral-100 shrink-0"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-[#1A1C1E] truncate">{title}</h1>
                {subtitle && <p className="text-sm text-neutral-500 truncate mt-0.5">{subtitle}</p>}
            </div>
            {rightAction && <div className="shrink-0">{rightAction}</div>}
        </header>
    );
};
