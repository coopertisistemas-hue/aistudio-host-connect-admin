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
    const { session_id, booking_id } = await req.json();

    if (!session_id || !booking_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: session_id and booking_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Não precisamos mais buscar a chave secreta do Stripe no DB
    
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid' && session.metadata?.booking_id === booking_id) {
      // Update booking status to 'confirmed'
      const { data: updatedBooking, error: updateError } = await supabaseClient
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating booking status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update booking status.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      return new Response(JSON.stringify({ success: true, booking: updatedBooking }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Stripe session not paid or metadata mismatch.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

  } catch (error) {
    console.error('Error in verify-stripe-session function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});