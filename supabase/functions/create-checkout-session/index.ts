import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";
import Stripe from "https://esm.sh/stripe@16.2.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chave secreta do Stripe lida diretamente do Secret Manager (Deno.env)
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe Secret Key not configured in Deno environment.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const { booking_id, total_amount, currency, guest_email, property_id, property_name, room_type_name, success_url, cancel_url } = await req.json();

    if (!booking_id || !total_amount || !currency || !guest_email || !property_id || !property_name || !room_type_name || !success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Não precisamos mais do supabaseClient para buscar a chave secreta
    
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Reserva: ${room_type_name} em ${property_name}`,
              description: `Reserva #${booking_id} para ${guest_email}`,
            },
            unit_amount: Math.round(total_amount * 100), // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: guest_email,
      metadata: {
        booking_id: booking_id,
        property_id: property_id,
        room_type_id: room_type_name,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});