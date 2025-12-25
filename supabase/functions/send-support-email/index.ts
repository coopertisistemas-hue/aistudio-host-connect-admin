
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
    name: string;
    email: string;
    type: "ticket" | "idea";
    subject: string;
    message: string;
    url?: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supportRequest: SupportRequest = await req.json();
        const { name, email, type, subject, message, url } = supportRequest;

        if (!name || !email || !type || !subject || !message) {
            throw new Error("Missing required fields");
        }

        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set");
            // For development purposes, if no key is set, we just log it and return success
            console.log("Mock Email Send:", supportRequest);
            return new Response(
                JSON.stringify({ message: "Email logged (Mock mode - No API Key)" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            );
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "HostConnect Support <onboarding@resend.dev>", // Or verified domain
                to: ["hostconnect@gmail.com"],
                reply_to: email,
                subject: `[${type.toUpperCase()}] ${subject}`,
                html: `
          <h1>New Support Request</h1>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          ${url ? `<p><strong>URL:</strong> ${url}</p>` : ""}
          <hr />
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        } else {
            console.error("Resend API Error:", data);
            return new Response(JSON.stringify({ error: "Failed to send email" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }
    } catch (error: any) {
        console.error("Error in send-support-email function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
};

serve(handler);
