import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function mapPagarmeStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    paid: "approved",
    pending: "pending",
    processing: "pending",
    authorized: "pending",
    canceled: "rejected",
    failed: "rejected",
    expired: "rejected",
    refunded: "refunded",
    partially_refunded: "refunded",
    chargedback: "refunded",
    overpaid: "approved",
    underpaid: "pending",
    voided: "rejected",
    not_authorized: "rejected",
    with_error: "rejected",
  };
  return statusMap[pagarmeStatus] || "pending";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("PAGARME_API_KEY");
    if (!apiKey) {
      throw new Error("PAGARME_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paymentId } = await req.json();

    if (!paymentId) {
      throw new Error("paymentId is required");
    }

    // Fetch order from Pagar.me
    const pagarmeResponse = await fetch(`https://api.pagar.me/core/v5/orders/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${btoa(apiKey + ":")}`,
        "Content-Type": "application/json",
      },
    });

    if (!pagarmeResponse.ok) {
      const errorText = await pagarmeResponse.text();
      throw new Error(`Pagar.me API error: ${pagarmeResponse.status} - ${errorText}`);
    }

    const pagarmeOrder = await pagarmeResponse.json();
    const charge = pagarmeOrder.charges?.[0];

    if (!charge) {
      throw new Error("No charge found in Pagar.me order");
    }

    const newPaymentStatus = mapPagarmeStatus(charge.status);
    console.log(`Pagar.me order ${paymentId}: charge status=${charge.status} -> ${newPaymentStatus}`);

    // Update order in database
    const { data, error } = await supabase
      .from("orders")
      .update({ payment_status: newPaymentStatus })
      .eq("payment_id", paymentId)
      .select("id, order_number, payment_status");

    if (error) {
      throw new Error(`Database update error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pagarmeStatus: charge.status,
        mappedStatus: newPaymentStatus,
        updatedOrders: data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
