import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";
import {
  auditLog,
  buildTraceId,
  enforceMethod,
  enforceRateLimit,
  enforceScope,
  getApiVersion,
  jsonResponse,
  rateLimitKey,
} from "../_shared/publicApi.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const REQUIRED_SCOPE = "public.website.settings.read";
const RATE_LIMIT_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

const ALLOWED_PUBLIC_SETTINGS = [
  "site_name",
  "site_logo_url",
  "site_favicon_url",
  "site_description",
  "site_about_content",
  "blog_url",
  "contact_email",
  "contact_phone",
  "social_facebook",
  "social_instagram",
  "social_google_business",
];

type WebsiteSettingsRequest = {
  property_id: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

serve(async (req) => {
  const methodError = enforceMethod(req, "POST");
  if (methodError) return methodError;

  const scopeError = enforceScope(req, REQUIRED_SCOPE);
  if (scopeError) return scopeError;

  const traceId = buildTraceId();
  const requestKey = rateLimitKey(req, "get-public-website-settings");
  const rateLimit = enforceRateLimit(requestKey, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.allowed) {
    auditLog("public_api.rate_limited", { trace_id: traceId, endpoint: "get-public-website-settings", request_key: requestKey });
    return jsonResponse(429, {
      contract_version: getApiVersion(),
      trace_id: traceId,
      code: "RATE_LIMITED",
      error: "Too many requests.",
    }, { "Retry-After": String(rateLimit.retryAfterSeconds) });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, {
      contract_version: getApiVersion(),
      trace_id: traceId,
      code: "EDGE_CONFIG_MISSING",
      error: "Edge function missing Supabase config.",
    });
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { property_id } = (await req.json()) as WebsiteSettingsRequest;

    if (!property_id) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "PAYLOAD_VALIDATION_FAILED",
        error: "Missing required parameter: property_id",
      });
    }

    if (!isUuid(property_id)) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "INVALID_IDENTIFIER",
        error: "property_id must be a valid UUID.",
      });
    }

    const providedApiKey = req.headers.get("x-public-api-key");
    const { data: apiKeySettings } = await supabaseClient
      .from("website_settings")
      .select("setting_value")
      .eq("property_id", property_id)
      .eq("setting_key", "public_api_key")
      .limit(1);
    const configuredApiKey = apiKeySettings?.[0]?.setting_value
      ? String(apiKeySettings[0].setting_value)
      : null;

    if (configuredApiKey && providedApiKey !== configuredApiKey) {
      return jsonResponse(401, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "API_KEY_INVALID",
        error: "Invalid public API key for property scope.",
      });
    }

    const { data: settings, error } = await supabaseClient
      .from("website_settings")
      .select("setting_key, setting_value")
      .eq("property_id", property_id)
      .in("setting_key", ALLOWED_PUBLIC_SETTINGS);

    if (error) {
      return jsonResponse(500, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "SETTINGS_FETCH_FAILED",
        error: error.message,
      });
    }

    const formattedSettings = settings.reduce<Record<string, unknown>>((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});

    auditLog("public_api.success", {
      trace_id: traceId,
      endpoint: "get-public-website-settings",
      property_id,
      code: "OK",
      settings_count: settings.length,
    });

    return jsonResponse(200, {
      contract_version: getApiVersion(),
      trace_id: traceId,
      code: "OK",
      data: formattedSettings,
    }, { "X-RateLimit-Remaining": String(rateLimit.remaining) });
  } catch (error) {
    auditLog("public_api.error", {
      trace_id: traceId,
      endpoint: "get-public-website-settings",
      code: "UNHANDLED_ERROR",
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(500, {
      contract_version: getApiVersion(),
      trace_id: traceId,
      code: "UNHANDLED_ERROR",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

