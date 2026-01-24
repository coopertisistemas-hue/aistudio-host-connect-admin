
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
            throw new Error("Campos obrigatórios ausentes");
        }

        if (!RESEND_API_KEY) {
            console.error("ERRO: RESEND_API_KEY não está configurada");
            // For development purposes, if no key is set, we just log it and return success
            console.log("Mock Email Send:", supportRequest);
            return new Response(
                JSON.stringify({ message: "E-mail registrado (Modo Mock - Sem Chave de API)" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            );
        }

        console.log(`Tentando enviar e-mail via Resend para: ${email}`);

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
          <h1>Novo Pedido de Suporte</h1>
          <p><strong>Tipo:</strong> ${type}</p>
          <p><strong>De:</strong> ${name} (${email})</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          ${url ? `<p><strong>URL:</strong> ${url}</p>` : ""}
          <hr />
          <h3>Mensagem:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            console.log("E-mail enviado com sucesso:", data.id);
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        } else {
            console.error("Erro na API do Resend:", data);
            const errorMessage = data.message || "Falha ao enviar e-mail";
            return new Response(JSON.stringify({ error: errorMessage }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }
    } catch (error: any) {
        console.error("Erro na função send-support-email:", error);
        return new Response(JSON.stringify({ error: error.message || "Erro interno ao processar e-mail" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
};

serve(handler);
