import React from "react";
import { PhoneFrameShell, MobileOnlyBlock, useIsMobileViewport } from "./PhoneFrameShell";

const IS_DEV = import.meta.env.DEV;
const MOBILE_ONLY_STRICT = !IS_DEV; // Only strict in PROD

/**
 * MobileRouteGuard: Protects mobile routes from desktop access in Production
 */
export const MobileRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isMobileViewport = useIsMobileViewport();

    // Logic: 
    // 1. If in DEV, always allow access but wrap in PhoneFrameShell for desktop visualization.
    // 2. If in PROD, block desktop access with MobileOnlyBlock.

    if (IS_DEV) {
        return <PhoneFrameShell>{children}</PhoneFrameShell>;
    }

    // Production Logic
    if (MOBILE_ONLY_STRICT && !isMobileViewport) {
        return <MobileOnlyBlock />;
    }

    // Mobile device in Production (or dev)
    return <>{children}</>;
};
