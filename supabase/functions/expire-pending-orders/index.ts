import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending orders older than 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: pendingOrders, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_number, created_at, payment_method")
      .eq("payment_status", "pending")
      .lt("created_at", cutoff);

    if (fetchError) {
      throw new Error(`Failed to fetch pending orders: ${fetchError.message}`);
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log("No expired pending orders found");
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingOrders.length} expired pending orders`);

    let expiredCount = 0;
    for (const order of pendingOrders) {
      // Update to rejected — the trigger will restore stock automatically
      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_status: "rejected", status: "cancelled" })
        .eq("id", order.id);

      if (updateError) {
        console.error(`Failed to expire order ${order.order_number}:`, updateError);
      } else {
        console.log(`Expired order ${order.order_number} (${order.payment_method}, created ${order.created_at})`);
        expiredCount++;
      }
    }

    return new Response(JSON.stringify({ expired: expiredCount, total: pendingOrders.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error expiring pending orders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
