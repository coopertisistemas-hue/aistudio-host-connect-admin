import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";
import { addDays, differenceInDays, format, parseISO } from "https://esm.sh/date-fns@3.6.0";
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

type PriceRequest = {
  property_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  selected_services_ids?: string[];
};

type PricingRule = {
  room_type_id: string | null;
  start_date: string;
  end_date: string;
  base_price_override: number | null;
  price_modifier: number | null;
  min_stay: number | null;
  max_stay: number | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const REQUIRED_SCOPE = "public.booking.pricing.read";
const RATE_LIMIT_PER_MINUTE = 30;
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
  const requestKey = rateLimitKey(req, "calculate-price");
  const rateLimit = enforceRateLimit(requestKey, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.allowed) {
    auditLog("public_api.rate_limited", { trace_id: traceId, endpoint: "calculate-price", request_key: requestKey });
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
    const payload = (await req.json()) as PriceRequest;
    const { property_id, room_type_id, check_in, check_out, total_guests, selected_services_ids = [] } = payload;

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

    const checkInDate = parseISO(check_in);
    const checkOutDate = parseISO(check_out);
    const numberOfNights = differenceInDays(checkOutDate, checkInDate);

    if (numberOfNights <= 0) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "DATE_RANGE_INVALID",
        error: "Check-out date must be after check-in date.",
      });
    }

    const { data: roomType, error: roomTypeError } = await supabaseClient
      .from("room_types")
      .select("base_price, capacity")
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

    const { data: pricingRules, error: pricingRulesError } = await supabaseClient
      .from("pricing_rules")
      .select("*")
      .eq("property_id", property_id)
      .eq("status", "active")
      .or(`room_type_id.eq.${room_type_id},room_type_id.is.null`)
      .lte("start_date", format(checkOutDate, "yyyy-MM-dd"))
      .gte("end_date", format(checkInDate, "yyyy-MM-dd"))
      .order("created_at", { ascending: false });

    if (pricingRulesError) {
      return jsonResponse(500, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "PRICING_RULES_FETCH_FAILED",
        error: "Error fetching pricing rules.",
      });
    }

    let totalAmount = 0;
    let minStayViolated = false;
    let maxStayViolated = false;
    let totalPricePerNight = 0;
    let currentDate = checkInDate;

    for (let i = 0; i < numberOfNights; i++) {
      let priceForThisNight = roomType.base_price;

      const applicableRule = (pricingRules as PricingRule[]).find((rule) => {
        const ruleStartDate = parseISO(rule.start_date);
        const ruleEndDate = parseISO(rule.end_date);
        const appliesToRoomType = !rule.room_type_id || rule.room_type_id === room_type_id;
        return appliesToRoomType && currentDate >= ruleStartDate && currentDate < ruleEndDate;
      });

      if (applicableRule) {
        if (applicableRule.base_price_override !== null) {
          priceForThisNight = applicableRule.base_price_override;
        } else if (applicableRule.price_modifier !== null) {
          priceForThisNight *= applicableRule.price_modifier;
        }

        if (applicableRule.min_stay !== null && numberOfNights < applicableRule.min_stay) {
          minStayViolated = true;
        }
        if (applicableRule.max_stay !== null && numberOfNights > applicableRule.max_stay) {
          maxStayViolated = true;
        }
      }

      totalAmount += priceForThisNight;
      totalPricePerNight += priceForThisNight;
      currentDate = addDays(currentDate, 1);
    }

    if (minStayViolated) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "MIN_STAY_VIOLATION",
        error: "Minimum stay requirement not met.",
      });
    }

    if (maxStayViolated) {
      return jsonResponse(400, {
        contract_version: getApiVersion(),
        trace_id: traceId,
        code: "MAX_STAY_VIOLATION",
        error: "Maximum stay requirement exceeded.",
      });
    }

    let totalServicesCost = 0;
    if (selected_services_ids.length > 0) {
      const { data: services, error: servicesError } = await supabaseClient
        .from("services")
        .select("price, is_per_person, is_per_day")
        .in("id", selected_services_ids)
        .eq("property_id", property_id)
        .eq("status", "active");

      if (servicesError) {
        return jsonResponse(500, {
          contract_version: getApiVersion(),
          trace_id: traceId,
          code: "SERVICES_FETCH_FAILED",
          error: "Error fetching services.",
        });
      }

      services.forEach((service) => {
        let serviceCost = service.price;
        if (service.is_per_person) serviceCost *= total_guests;
        if (service.is_per_day) serviceCost *= numberOfNights;
        totalServicesCost += serviceCost;
      });
    }

    totalAmount += totalServicesCost;
    const averagePricePerNight = totalPricePerNight / numberOfNights;

    auditLog("public_api.success", {
      trace_id: traceId,
      endpoint: "calculate-price",
      property_id,
      code: "OK",
    });

    return jsonResponse(200, {
      contract_version: getApiVersion(),
      trace_id: traceId,
      code: "OK",
      data: {
        total_amount: parseFloat(totalAmount.toFixed(2)),
        price_per_night: parseFloat(averagePricePerNight.toFixed(2)),
        number_of_nights: numberOfNights,
      },
    }, { "X-RateLimit-Remaining": String(rateLimit.remaining) });
  } catch (error) {
    auditLog("public_api.error", {
      trace_id: traceId,
      endpoint: "calculate-price",
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

