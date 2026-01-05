import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_VALUES = [50, 100, 150, 200, 300];

const generateGiftCardCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { value, purchaserName, purchaserEmail, recipientName, recipientEmail, message, sendToRecipient } = await req.json();

    // Validate required fields
    if (!value || !purchaserName || !purchaserEmail) {
      console.error("Missing required fields:", { value, purchaserName, purchaserEmail });
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate value is in allowed list
    if (!ALLOWED_VALUES.includes(value)) {
      console.error("Invalid gift card value:", value);
      return new Response(
        JSON.stringify({ error: "Valor do gift card inválido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate purchaser email format
    if (!validateEmail(purchaserEmail)) {
      console.error("Invalid purchaser email:", purchaserEmail);
      return new Response(
        JSON.stringify({ error: "Email do comprador inválido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate recipient email if sending to recipient
    if (sendToRecipient) {
      if (!recipientName || !recipientEmail) {
        console.error("Missing recipient info for sendToRecipient:", { recipientName, recipientEmail });
        return new Response(
          JSON.stringify({ error: "Dados do presenteado são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!validateEmail(recipientEmail)) {
        console.error("Invalid recipient email:", recipientEmail);
        return new Response(
          JSON.stringify({ error: "Email do presenteado inválido" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate name lengths
    if (purchaserName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Nome do comprador muito longo" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recipientName && recipientName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Nome do presenteado muito longo" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message && message.length > 500) {
      return new Response(
        JSON.stringify({ error: "Mensagem muito longa (máximo 500 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique code
    const code = generateGiftCardCode();

    // Calculate expiry (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    console.log("Creating gift card:", { code, value, purchaserEmail, sendToRecipient });

    // Use the secure database function to create gift card
    const { data, error } = await supabase.rpc('create_gift_card', {
      _code: code,
      _initial_value: value,
      _purchaser_email: purchaserEmail.toLowerCase().trim(),
      _purchaser_name: purchaserName.trim(),
      _recipient_email: sendToRecipient ? recipientEmail?.toLowerCase().trim() : null,
      _recipient_name: sendToRecipient ? recipientName?.trim() : null,
      _recipient_message: message?.trim() || null,
      _send_to_recipient: sendToRecipient || false,
      _expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error("Error creating gift card:", error);
      return new Response(
        JSON.stringify({ error: "Erro ao criar gift card" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Gift card created successfully:", { id: data, code });

    return new Response(
      JSON.stringify({ 
        success: true, 
        code,
        value,
        expiresAt: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
