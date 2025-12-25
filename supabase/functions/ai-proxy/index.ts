import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/*
 * BYO Key Guardrails Implementation:
 * This function handles AI requests on the server-side.
 * It retrieves API keys from secure Environment Variables (Vault),
 * ensuring they never touch the client-side code.
 */

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt, model = 'gpt-3.5-turbo' } = await req.json();

        // 1. Retrieve Secret from Env (Server-Side Only)
        // NEVER accept 'apiKey' from the request body
        const openAiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAiKey) {
            console.error("Missing Backend API Key Configuration");
            return new Response(
                JSON.stringify({
                    error: "Service Configuration Error",
                    details: "AI Provider not configured securely on server."
                }),
                {
                    status: 503, // Service Unavailable
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 2. Mock AI Call (Placeholder for actual OpenAI/Gemini integration)
        // In production, fetch('https://api.openai.com/v1/chat/completions', ...)

        console.log(`Processing secure AI request for model: ${model}`);

        const mockResponse = {
            id: "mock-completion-" + Date.now(),
            object: "chat.completion",
            created: Date.now(),
            model: model,
            choices: [{
                index: 0,
                message: {
                    role: "assistant",
                    content: `[Secure Server Response] Processed your request: "${prompt && prompt.substring(0, 20)}..." using backend-managed credentials.`
                },
                finish_reason: "stop"
            }]
        };

        return new Response(
            JSON.stringify(mockResponse),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
