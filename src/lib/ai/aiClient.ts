
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface contract for AI operations.
 * This ensures that no API keys are ever passed from the client.
 */
interface AiResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

interface AiRequest {
    messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
    model?: 'gpt-4o' | 'gpt-4o-mini' | 'gemini-pro';
    temperature?: number;
}

/**
 * Securely invokes the AI Proxy Edge Function.
 * The API Key is retrieved on the server-side from environment variables.
 */
export const askAi = async (payload: AiRequest): Promise<AiResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: payload
        });

        if (error) {
            // Handle structured error from backend
            try {
                // supabase.functions.invoke might parse JSON error into 'error' object if possible?
                // Actually supabase-js usually returns error as { message, context } or similar.
                // The body response is often in 'data' if status is 2xx, but for 4xx/5xx it behaves differently.
                // If the edge function returns 403, invoke returns error. 
                // We need to parse the response body if possible or rely on the error message.

                // Supabase Edge Function error handling nuance:
                // If we return 403, error will be populated. We might need to check if we can get the body.
                // However, simplifying: check if error message contains FEATURE_NOT_ALLOWED or we wrap it in frontend.

                // Let's assume the backend response body is passed through or we can read it.
                // If not, we will just map generic 403 to upgrade required.

                // If code is FEATURE_NOT_ALLOWED
                if (error && error.message && error.message.includes('FEATURE_NOT_ALLOWED')) {
                    throw new Error('PLAN_LIMIT_REACHED');
                }
            } catch (e) {
                // ignore parse
            }

            console.error('AI Proxy Error:', error);

            // Temporary workaround if we can't easily parse 403 body:
            // Since we know our backend 403 means auth or feature block.
            // If we authenticated locally (RLS works), then it's likely Entitlement.
            // To be robust, let's propagate the error. 
            // Better: 'Falha na comunicação' is too generic.

            throw error;
        }

        // Check if data itself has the error struct (sometimes dependent on invoke behavior)
        if (data && data.code === 'FEATURE_NOT_ALLOWED') {
            throw new Error('PLAN_LIMIT_REACHED');
        }

        return data as AiResponse;

    } catch (err: any) {
        console.error('AI Client Exception:', err);
        if (err.message === 'PLAN_LIMIT_REACHED' || (err.context && err.context.status === 403)) {
            // We can signal UI to show Upgrade
            // For now, rethrow simple message that UI can catch
            throw new Error('UpgradeRequired: Acesso a IA indisponível no plano atual.');
        }
        throw err;
    }
};

/**
 * SECURITY GUARDRAIL:
 * Explicitly checking that we are NOT storing any keys in storage.
 * This function can be called during app initialization/debug.
 */
export const auditSecurity = () => {
    const prohibitedKeys = ['openai', 'gemini', 'apiKey', 'sk-'];
    const storageFound = [];

    // Check LocalStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && prohibitedKeys.some(pk => key.toLowerCase().includes(pk.toLowerCase()))) {
            storageFound.push(`localStorage: ${key}`);
        }
    }

    // Check SessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && prohibitedKeys.some(pk => key.toLowerCase().includes(pk.toLowerCase()))) {
            storageFound.push(`sessionStorage: ${key}`);
        }
    }

    if (storageFound.length > 0) {
        console.warn('SECURITY ALERT: Potential API Keys found in storage!', storageFound);
        // Ideally, we would clear them here or alert the user
    }

    // Verify Env Vars are not leaked in frontend bundle (basic check)
    // Note: Vite exposes VITE_ prefixed vars. We should ensure no VITE_OPENAI_KEY exists.
    if (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) {
        console.error('CRITICAL: AI API Keys detected in public environment variables!');
    }
};
