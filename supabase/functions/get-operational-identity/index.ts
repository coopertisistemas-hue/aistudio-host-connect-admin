
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { property_id } = await req.json()

        if (!property_id) {
            throw new Error('Property ID is required')
        }

        // Verify User
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // 1. Fetch Property Details (Name)
        const { data: property, error: propError } = await supabaseClient
            .from('properties')
            .select('name')
            .eq('id', property_id)
            .single()

        if (propError || !property) {
            console.error('Property fetch error:', propError)
            throw new Error('Property not found or access denied')
        }

        // 2. Fetch User Profile (Full Name)
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        // 3. Fetch Logo (Entity Photo with is_primary = true)
        const { data: photo } = await supabaseClient
            .from('entity_photos')
            .select('photo_url')
            .eq('entity_id', property_id)
            .eq('is_primary', true)
            .maybeSingle()

        // Processing Logic (Replicating Frontend Hook Logic)

        // Client Name Reduction
        const rawName = property.name || "Operações"
        const words = rawName.split(' ')
        let client_short_name = words[0]

        if (words.length > 1) {
            const p2 = words[1].toLowerCase()
            const prepositions = ['de', 'do', 'da', 'di', 'dos', 'das']

            if (prepositions.includes(p2) && words.length > 2) {
                client_short_name = `${words[0]} ${words[1]} ${words[2]}`
            } else if (words[1].length > 2) {
                client_short_name = `${words[0]} ${words[1]}`
            }
        }

        // Staff Name Reduction
        const rawStaffName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Colaborador"
        const nameParts = rawStaffName.split(' ')
        const staff_short_name = nameParts.length > 1
            ? `${nameParts[0]} ${nameParts[1][0]}.` // "Alexandre S."
            : nameParts[0]

        // Logo URL
        const client_logo_url = photo?.photo_url || null

        // Construct Response
        const responseData = {
            client_logo_url,
            client_short_name,
            staff_short_name,
        }

        console.log('Operational Identity Response:', JSON.stringify(responseData))

        return new Response(
            JSON.stringify(responseData),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
