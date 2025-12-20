import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves OTA lidas diretamente do Secret Manager (Deno.env)
const BOOKING_COM_API_KEY = Deno.env.get("BOOKING_COM_API_KEY");
const AIRBNB_API_KEY = Deno.env.get("AIRBNB_API_KEY");
const EXPEDIA_API_KEY = Deno.env.get("EXPEDIA_API_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id, room_type_id, date, price, availability } = await req.json();

    if (!property_id || !room_type_id || !date || (price === undefined && availability === undefined)) {
      return new Response(JSON.stringify({ error: 'Missing required parameters.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Não precisamos mais do supabaseClient para buscar as chaves
    
    const results: Record<string, string> = {};

    // --- Sincronização com Booking.com (Simulação) ---
    if (BOOKING_COM_API_KEY) {
      // Aqui entraria a lógica real de chamada à API do Booking.com
      results['booking_com'] = `Sincronização simulada: Preço ${price}, Disponibilidade ${availability} para ${date}.`;
    } else {
      results['booking_com'] = 'Chave de API ausente no Deno.env.';
    }

    // --- Sincronização com Airbnb (Simulação) ---
    if (AIRBNB_API_KEY) {
      // Aqui entraria a lógica real de chamada à API do Airbnb
      results['airbnb'] = `Sincronização simulada: Preço ${price}, Disponibilidade ${availability} para ${date}.`;
    } else {
      results['airbnb'] = 'Chave de API ausente no Deno.env.';
    }

    // --- Sincronização com Expedia (Simulação) ---
    if (EXPEDIA_API_KEY) {
      // Aqui entraria a lógica real de chamada à API da Expedia
      results['expedia'] = `Sincronização simulada: Preço ${price}, Disponibilidade ${availability} para ${date}.`;
    } else {
      results['expedia'] = 'Chave de API ausente no Deno.env.';
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in sync-ota-inventory function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});