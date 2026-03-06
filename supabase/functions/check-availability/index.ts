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

type AvailabilityRequest = {
  property_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  total_guests: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const REQUIRED_SCOPE = "public.booking.availability.read";
const RATE_LIMIT_PER_MINUTE = 45;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

serve(async (req) => {
  const methodError = enforceMethod(req, "POST");
  if (methodError) return methodError;

  const scopeError = enforceScope(req, REQUIRED_SCOPE);
  if (scopeError) return scopeError;

  const traceId = buildTraceId();
  const requestKey = rateLimitKey(req, "check-availability");
  const rateLimit = enforceRateLimit(requestKey, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.allowed) {
    auditLog("public_api.rate_limited", { trace_id: traceId, endpoint: "check-availability", request_key: requestKey });
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
    const payload = (await req.json()) as AvailabilityRequest;
    const { property_id, room_type_id, check_in, check_out, total_guests } = payload;

    if (!property_id || !room_type_id || !check_in || !check_out || !total_guests) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "PAYLOAD_VALIDATION_FAILED",
        error: "Missing required parameters.",
      });
    }

    if (!isUuid(property_id) || !isUuid(room_type_id)) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "INVALID_IDENTIFIER",
        error: "property_id and room_type_id must be valid UUIDs.",
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

    const { data: bookingFlagRows } = await supabaseClient
      .from("website_settings")
      .select("setting_value")
      .eq("property_id", property_id)
      .eq("setting_key", "booking_engine_enabled")
      .limit(1);

    if (bookingFlagRows?.length) {
      const flagValue = String(bookingFlagRows[0].setting_value).toLowerCase();
      if (flagValue === "false" || flagValue === "0") {
        return jsonResponse(403, {
          contract_version: getApiVersion(),
          trace_id: traceId,
          code: "BOOKING_ENGINE_DISABLED",
          error: "Booking engine is disabled for this property.",
        });
      }
    }

    const { data: roomType, error: roomTypeError } = await supabaseClient
      .from("room_types")
      .select("capacity")
      .eq("id", room_type_id)
      .eq("property_id", property_id)
      .single();

    if (roomTypeError || !roomType) {
      return jsonResponse(404, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "ROOM_TYPE_NOT_FOUND",
        error: "Room type not found for property scope.",
      });
    }

    if (total_guests > roomType.capacity) {
      return jsonResponse(200, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "OK",
        data: {
          available: false,
          remainingAvailableRooms: 0,
          message: "Number of guests exceeds room type capacity.",
        },
      });
    }

    const { data: totalRooms, error: totalRoomsError } = await supabaseClient
      .from("rooms")
      .select("id")
      .eq("property_id", property_id)
      .eq("room_type_id", room_type_id)
      .eq("status", "available");

    if (totalRoomsError) {
      return jsonResponse(500, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "ROOMS_FETCH_FAILED",
        error: "Error fetching rooms.",
      });
    }

    const { data: occupiedBookings, error: occupiedBookingsError } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("property_id", property_id)
      .eq("room_type_id", room_type_id)
      .in("status", ["pending", "confirmed"])
      .lt("check_in", check_out)
      .gt("check_out", check_in);

    if (occupiedBookingsError) {
      return jsonResponse(500, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "BOOKINGS_FETCH_FAILED",
        error: "Error fetching occupied bookings.",
      });
    }

    const totalAvailableRooms = totalRooms.length;
    const occupiedRoomsCount = occupiedBookings.length;
    const remainingAvailableRooms = totalAvailableRooms - occupiedRoomsCount;

    const available = remainingAvailableRooms > 0;
    const message = available
      ? `Available rooms: ${remainingAvailableRooms}`
      : "No rooms available for the selected period.";

    auditLog("public_api.success", {
      trace_id: traceId,
      endpoint: "check-availability",
      property_id,
      code: "OK",
    });

    return jsonResponse(200, {
      contract_version: getApiVersion(),
      trace_id: traceId,
      code: "OK",
      data: {
        available,
        remainingAvailableRooms,
        message,
      },
    }, { "X-RateLimit-Remaining": String(rateLimit.remaining) });
  } catch (error) {
    auditLog("public_api.error", {
      trace_id: traceId,
      endpoint: "check-availability",
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

