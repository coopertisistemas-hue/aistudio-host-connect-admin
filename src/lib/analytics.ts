// Google Analytics 4 Utility

// Define the window interface to include gtag
declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event' | 'js',
            targetId: string,
            config?: Record<string, any>
        ) => void;
        dataLayer: any[];
    }
}

export const GA_MEASUREMENT_ID = 'G-GEYPCRECWK';

type GTagEvent = {
    action: string;
    category: string;
    label?: string;
    value?: number;
    [key: string]: any;
};

export const pageview = (url: string) => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }
};

export const event = ({ action, category, label, value, ...props }: GTagEvent) => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            ...props,
        });
    }
};

// Pre-defined event helpers for specific modules
export const trackLogin = (method: string) => {
    event({
        action: 'login',
        category: 'authentication',
        label: method,
    });
};

export const trackOperation = (action: string, module: string, details?: string) => {
    event({
        action: action,
        category: 'operation',
        label: module,
        details,
    });
};
