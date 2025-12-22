import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Monitor, Smartphone, QrCode, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const IS_DEV = import.meta.env.DEV;

/**
 * Hook to detect if currently in a mobile viewport
 */
export const useIsMobileViewport = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile;
};

/**
 * MobileOnlyBlock: Premium screen to block desktop access in Production
 */
export const MobileOnlyBlock: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUrl = window.location.href;

    return (
        <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-neutral-100">
                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <Smartphone className="h-10 w-10 text-primary" />
                </div>

                <h1 className="text-3xl font-bold text-[#1A1C1E] mb-4 tracking-tight">O módulo operacional está no celular</h1>
                <p className="text-neutral-500 mb-10 leading-relaxed">
                    Este módulo foi desenhado exclusivamente para uso em tempo real por camareiras e técnicos no smartphone.
                </p>

                <div className="space-y-4">
                    <Button
                        variant="default"
                        className="w-full h-14 rounded-2xl text-[15px] font-bold gap-2"
                        onClick={() => navigate("/dashboard")}
                    >
                        <Home className="h-5 w-5" />
                        Ir para o Painel Desktop
                    </Button>

                    <div className="pt-4 flex flex-col items-center gap-3">
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col items-center gap-2">
                            <QrCode className="h-24 w-24 text-neutral-300" />
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Escaneie para acessar no celular</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-[11px] font-bold text-neutral-300 uppercase tracking-widest">
                Host Connect Mobile Experience
            </p>
        </div>
    );
};

/**
 * PhoneFrameShell: Renders a phone frame on desktop (Dev only or by choice)
 */
export const PhoneFrameShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isMobileViewport = useIsMobileViewport();

    if (isMobileViewport) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-8 overflow-hidden font-sans">
            {/* DEV Badge */}
            {IS_DEV && (
                <div className="absolute top-6 right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">DEV • Mobile Preview</span>
                </div>
            )}

            {/* Phone Frame */}
            <div className="relative w-[430px] h-[90vh] bg-white rounded-[45px] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-[8px] border-[#1A1C1E] overflow-hidden flex flex-col">
                {/* Notch - Optional aesthetic */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#1A1C1E] rounded-b-2xl z-50 flex items-center justify-center">
                    <div className="h-1.5 w-12 bg-neutral-800 rounded-full" />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto scrollbar-hide bg-[#F8FAF9]">
                    {children}
                </div>

                {/* Home Indicator */}
                <div className="h-6 w-full flex items-center justify-center bg-white">
                    <div className="h-1.5 w-32 bg-neutral-200 rounded-full" />
                </div>
            </div>
        </div>
    );
};
