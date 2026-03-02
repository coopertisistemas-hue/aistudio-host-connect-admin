import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

type OtaName = "booking_com" | "airbnb" | "expedia";

type OtaSyncStatus = "success" | "failed";

type OtaSyncResult = {
  ota: OtaName;
  status: OtaSyncStatus;
  code: string;
  message: string;
  retryable: boolean;
  attempts: number;
};

type SyncRequest = {
  property_id: string;
  room_type_id: string;
  date: string;
  price?: number;
  availability?: number;
  max_attempts?: number;
};

const BOOKING_COM_API_KEY = Deno.env.get("BOOKING_COM_API_KEY");
const AIRBNB_API_KEY = Deno.env.get("AIRBNB_API_KEY");
const EXPEDIA_API_KEY = Deno.env.get("EXPEDIA_API_KEY");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function parseMaxAttempts(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 2;
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function makeTraceId(): string {
  return crypto.randomUUID();
}

function isRetryableCode(code: string): boolean {
  return code === "OTA_TIMEOUT" || code === "OTA_429" || code === "OTA_5XX";
}

async function simulateOtaUpdate(ota: OtaName, payload: SyncRequest): Promise<void> {
  // Placeholder behavior for SP10 foundation. Real OTA adapters are implemented in later sprints.
  if ((payload.price ?? 0) < 0 || (payload.availability ?? 0) < 0) {
    throw new Error("INVALID_INPUT");
  }

  // Keep deterministic success while preserving retry contract support.
  if (ota === "booking_com" || ota === "airbnb" || ota === "expedia") {
    return;
  }

  throw new Error("OTA_UNKNOWN");
}

async function syncWithRetry(
  ota: OtaName,
  apiKey: string | undefined,
  payload: SyncRequest,
  maxAttempts: number,
): Promise<OtaSyncResult> {
  if (!apiKey) {
    return {
      ota,
      status: "failed",
      code: "CONFIG_MISSING_API_KEY",
      message: "OTA API key not configured in edge function secrets.",
      retryable: false,
      attempts: 0,
    };
  }

  let attempts = 0;
  let lastCode = "OTA_UNKNOWN";
  let lastMessage = "Unknown OTA sync error.";

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      await simulateOtaUpdate(ota, payload);
      return {
        ota,
        status: "success",
        code: "SYNC_OK",
        message: `Sync accepted for ${ota} (${payload.date}).`,
        retryable: false,
        attempts,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw === "INVALID_INPUT") {
        lastCode = "VALIDATION_FAILED";
        lastMessage = "Payload validation failed for OTA sync.";
      } else {
        lastCode = "OTA_TIMEOUT";
        lastMessage = `Temporary OTA sync failure (${ota}), attempt ${attempts}.`;
      }

      if (!isRetryableCode(lastCode) || attempts >= maxAttempts) {
        return {
          ota,
          status: "failed",
          code: lastCode,
          message: lastMessage,
          retryable: isRetryableCode(lastCode),
          attempts,
        };
      }
    }
  }

  return {
    ota,
    status: "failed",
    code: lastCode,
    message: lastMessage,
    retryable: isRetryableCode(lastCode),
    attempts,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Edge function missing Supabase config." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const traceId = makeTraceId();
  const idempotencyKey = req.headers.get("x-idempotency-key") ?? `${traceId}:sync-ota`;

  try {
    const payload = (await req.json()) as SyncRequest;
    const { property_id, room_type_id, date, price, availability, max_attempts } = payload;

    if (!property_id || !room_type_id || !date || (price === undefined && availability === undefined)) {
      return new Response(JSON.stringify({
        trace_id: traceId,
        error: "Missing required parameters.",
        code: "PAYLOAD_VALIDATION_FAILED",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({
        trace_id: traceId,
        code: "AUTH_REQUIRED",
        error: "Invalid auth context.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: property, error: propertyError } = await userClient
      .from("properties")
      .select("id, org_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return new Response(JSON.stringify({
        trace_id: traceId,
        code: "TENANT_SCOPE_VIOLATION",
        error: "Property not accessible in current tenant scope.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const attempts = parseMaxAttempts(max_attempts);
    const results = await Promise.all([
      syncWithRetry("booking_com", BOOKING_COM_API_KEY, payload, attempts),
      syncWithRetry("airbnb", AIRBNB_API_KEY, payload, attempts),
      syncWithRetry("expedia", EXPEDIA_API_KEY, payload, attempts),
    ]);

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.length - successCount;
    const retryableFailedCount = results.filter((r) => r.status === "failed" && r.retryable).length;

    return new Response(JSON.stringify({
      contract_version: "v1.0",
      trace_id: traceId,
      idempotency_key: idempotencyKey,
      property_id,
      room_type_id,
      date,
      success: failedCount === 0,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        retryable_failed: retryableFailedCount,
      },
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in sync-ota-inventory function:", { traceId, error });
    return new Response(JSON.stringify({
      trace_id: traceId,
      code: "UNHANDLED_ERROR",
      error: error instanceof Error ? error.message : String(error),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
