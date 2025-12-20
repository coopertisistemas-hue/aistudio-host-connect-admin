import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";
import { differenceInDays, parseISO, addDays, format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const { property_id, room_type_id, check_in, check_out, total_guests, selected_services_ids = [] } = await req.json();

    if (!property_id || !room_type_id || !check_in || !check_out || !total_guests) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const checkInDate = parseISO(check_in);
    const checkOutDate = parseISO(check_out);
    const numberOfNights = differenceInDays(checkOutDate, checkInDate);

    if (numberOfNights <= 0) {
      return new Response(JSON.stringify({ error: 'Check-out date must be after check-in date' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Get base price and capacity of the room type
    const { data: roomType, error: roomTypeError } = await supabaseClient
      .from('room_types')
      .select('base_price, capacity')
      .eq('id', room_type_id)
      .eq('property_id', property_id)
      .single();

    if (roomTypeError || !roomType) {
      console.error('Error fetching room type:', roomTypeError);
      return new Response(JSON.stringify({ error: 'Room type not found or inaccessible' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const basePrice = roomType.base_price;
    let totalAmount = 0;
    let minStayViolated = false;
    let maxStayViolated = false;
    let totalPricePerNight = 0; // Used for calculating average price per night

    // 2. Fetch all relevant pricing rules for the period
    const { data: pricingRules, error: pricingRulesError } = await supabaseClient
      .from('pricing_rules')
      .select('*')
      .eq('property_id', property_id)
      .eq('status', 'active')
      .or(`room_type_id.eq.${room_type_id},room_type_id.is.null`)
      .lte('start_date', format(checkOutDate, 'yyyy-MM-dd'))
      .gte('end_date', format(checkInDate, 'yyyy-MM-dd'))
      .order('created_at', { ascending: false }); // Order by creation date to prioritize newer rules if needed, but date specificity is key

    if (pricingRulesError) {
      console.error('Error fetching pricing rules:', pricingRulesError);
      return new Response(JSON.stringify({ error: 'Error fetching pricing rules' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 3. Iterate day by day to calculate price
    let currentDate = checkInDate;
    for (let i = 0; i < numberOfNights; i++) {
      let priceForThisNight = basePrice;
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      
      // Find the most specific and active rule for this specific night
      const applicableRule = pricingRules.find(rule => {
        const ruleStartDate = parseISO(rule.start_date);
        const ruleEndDate = parseISO(rule.end_date);
        
        const appliesToRoomType = !rule.room_type_id || rule.room_type_id === room_type_id;
        
        return appliesToRoomType && 
               currentDate >= ruleStartDate && 
               currentDate < ruleEndDate; // Rule applies until the day before the end date
      });

      if (applicableRule) {
        if (applicableRule.base_price_override !== null) {
          priceForThisNight = applicableRule.base_price_override;
        } else if (applicableRule.price_modifier !== null) {
          priceForThisNight *= applicableRule.price_modifier;
        }

        // Check stay constraints (only check once based on the most restrictive rule found, or the last one applied)
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
      return new Response(JSON.stringify({ error: 'Minimum stay requirement not met' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (maxStayViolated) {
      return new Response(JSON.stringify({ error: 'Maximum stay requirement exceeded' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 4. Add selected services
    let totalServicesCost = 0;
    if (selected_services_ids.length > 0) {
      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .select('price, is_per_person, is_per_day')
        .in('id', selected_services_ids)
        .eq('property_id', property_id)
        .eq('status', 'active');

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return new Response(JSON.stringify({ error: 'Error fetching services' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      services.forEach(service => {
        let serviceCost = service.price;
        if (service.is_per_person) {
          serviceCost *= total_guests;
        }
        if (service.is_per_day) {
          serviceCost *= numberOfNights;
        }
        totalServicesCost += serviceCost;
      });
    }
    
    totalAmount += totalServicesCost;
    
    const averagePricePerNight = totalPricePerNight / numberOfNights;

    return new Response(JSON.stringify({ 
      total_amount: parseFloat(totalAmount.toFixed(2)), 
      price_per_night: parseFloat(averagePricePerNight.toFixed(2)), 
      number_of_nights: numberOfNights 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in calculate-price function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});