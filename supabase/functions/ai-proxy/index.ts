import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
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

        // 0. Initialize Supabase Client to check entitlements
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        // Create client with the user's JWT to verify identity
        // We need to use schema 'public' to access profiles
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Get User
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        // Check Entitlements (Profile)
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('plan, plan_status, trial_expires_at')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: "Profile not found" }), { status: 403, headers: corsHeaders });
        }

        // Entitlement Logic (Shared with Frontend)
        const now = new Date();
        const trialEndDate = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
        const isTrialActive = profile.plan_status === 'trial' && trialEndDate && now <= trialEndDate;

        let effectivePlan = profile.plan || 'free';
        if (isTrialActive) {
            effectivePlan = 'premium'; // Trial implies premium access
        }

        const allowedPlans = ['premium', 'founder', 'pro']; // 'pro' has AI? checking useEntitlements.ts... Yes: pro, premium, founder
        // Based on previous Context: "Pro: 10 acomodações, Channel Manager + Chat." 
        // "Premium: 100 acomodações, E-commerce + AI". 
        // Wait, useEntitlements.ts says: 
        // pro: { ai_assistant: true, ... } 
        // premium: { ai_assistant: true, ... }
        // founder: { ai_assistant: true, ... }
        // So 'pro' IS allowed.

        if (!allowedPlans.includes(effectivePlan)) {
            return new Response(
                JSON.stringify({
                    code: 'FEATURE_NOT_ALLOWED',
                    message: 'AI Assistant requires a Pro, Premium, or Founder plan.'
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 1. Retrieve Secret from Env (server-side only)
        const openAiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAiKey) {
            console.error("Missing Backend API Key Configuration");
            return new Response(
                JSON.stringify({
                    error: "Service Configuration Error",
                    details: "AI Provider not configured securely on server."
                }),
                {
                    status: 503,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 2. Mock AI Call (Placeholder)
        const mockResponse = {
            id: "mock-completion-" + Date.now(),
            object: "chat.completion",
            created: Date.now(),
            model: model,
            choices: [{
                index: 0,
                message: {
                    role: "assistant",
                    content: `[Secure Server Response] Processed your request: "${prompt && prompt.substring(0, 20)}..." using backend-managed credentials. (Plan: ${effectivePlan})`
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
