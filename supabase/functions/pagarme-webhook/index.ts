import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Pagar.me charge statuses to our payment_status
function mapPagarmeStatus(pagarmeStatus: string): string {
  const statusMap: Record<string, string> = {
    paid: "approved",
    pending: "pending",
    processing: "pending",
    authorized: "pending",
    canceled: "refunded",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Pagar.me webhook received:", JSON.stringify(body.type));

    const eventType = body.type || "";
    const eventData = body.data;

    if (!eventData) {
      console.log("No event data, ignoring");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to send email notification
    async function sendOrderEmail(orderId: string, emailType: string) {
      try {
        // Fetch order with items
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("payment_id", orderId)
          .single();

        if (!order) return;

        const { data: items } = await supabase
          .from("order_items")
          .select("product_name, variant_info, quantity, unit_price, total_price")
          .eq("order_id", order.id);

        // Call send-email function
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: emailType,
            to: order.customer_email,
            data: { ...order, items: items || [] },
          }),
        });
        console.log(`Email ${emailType} sent to ${order.customer_email}`);
      } catch (err) {
        console.error(`Failed to send ${emailType} email:`, err);
      }
    }

    // Handle charge events
    if (eventType.startsWith("charge.")) {
      const charge = eventData;
      const orderId = charge.order?.id || charge.order_id;
      const chargeStatus = charge.status;

      if (!orderId) {
        console.log("No order ID in webhook, ignoring");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newPaymentStatus = mapPagarmeStatus(chargeStatus);
      console.log(`Updating order with payment_id=${orderId}: charge status=${chargeStatus} -> payment_status=${newPaymentStatus}`);

      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status: newPaymentStatus })
        .eq("payment_id", orderId)
        .select("id, order_number, payment_status");

      if (error) {
        console.error("Error updating order:", error);
      } else if (data && data.length > 0) {
        console.log(`Order ${data[0].order_number} payment_status updated to ${newPaymentStatus}`);
        
        // Send email based on new payment status
        if (newPaymentStatus === "approved") {
          await sendOrderEmail(orderId, "payment_approved");
        } else if (newPaymentStatus === "rejected") {
          await sendOrderEmail(orderId, "payment_rejected");
        } else if (newPaymentStatus === "refunded") {
          await sendOrderEmail(orderId, "order_cancelled");
        }
      } else {
        console.log(`No order found with payment_id=${orderId}`);
      }
    }

    // Handle order events
    if (eventType.startsWith("order.")) {
      const order = eventData;
      const pagarmeOrderId = order.id;
      const orderStatus = order.status;

      if (pagarmeOrderId && orderStatus) {
        const charge = order.charges?.[0];
        const chargeStatus = charge?.status;

        if (chargeStatus) {
          const newPaymentStatus = mapPagarmeStatus(chargeStatus);
          console.log(`Order event: Updating payment_id=${pagarmeOrderId}: ${chargeStatus} -> ${newPaymentStatus}`);

          await supabase
            .from("orders")
            .update({ payment_status: newPaymentStatus })
            .eq("payment_id", pagarmeOrderId);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    // Always return 200 to Pagar.me to avoid retries on our processing errors
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
