import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface ShippingOption {
  id: number;
  name: string;
  price: number;
  delivery_time: number;
}

interface CheckoutRequest {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  shipping: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  shippingOption?: ShippingOption;
  giftCardCode?: string;
  giftCardDiscount?: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const { items, customer, shipping, shippingOption, giftCardCode, giftCardDiscount = 0 }: CheckoutRequest = await req.json();

    // Calculate total
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = shippingOption?.price || 0;
    const total = Math.max(0, subtotal - giftCardDiscount + shippingCost);

    console.log("Checkout calculation:", { subtotal, shippingCost, giftCardDiscount, total });

    // Prepare items for Mercado Pago
    const mpItems = items.map((item) => ({
      id: item.id,
      title: `${item.name}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "BRL",
    }));

    // Add gift card discount as negative item if applicable
    if (giftCardDiscount > 0) {
      mpItems.push({
        id: "gift-card-discount",
        title: `Desconto Gift Card (${giftCardCode})`,
        quantity: 1,
        unit_price: -giftCardDiscount,
        currency_id: "BRL",
      });
    }

    // Add shipping as item if applicable
    if (shippingOption && shippingOption.price > 0) {
      mpItems.push({
        id: "shipping",
        title: `Frete - ${shippingOption.name}`,
        quantity: 1,
        unit_price: shippingOption.price,
        currency_id: "BRL",
      });
    }

    // Get the origin URL for redirects
    const origin = req.headers.get("origin") || "https://localhost:5173";

    // Create preference in Mercado Pago
    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: mpItems,
        payer: {
          name: customer.name.split(" ")[0],
          surname: customer.name.split(" ").slice(1).join(" ") || "",
          email: customer.email,
          phone: {
            area_code: customer.phone.substring(0, 2),
            number: customer.phone.substring(2),
          },
          identification: {
            type: "CPF",
            number: customer.cpf.replace(/\D/g, ""),
          },
          address: {
            zip_code: shipping.zipCode.replace(/\D/g, ""),
            street_name: shipping.street,
            street_number: parseInt(shipping.number) || 0,
          },
        },
        shipments: {
          receiver_address: {
            zip_code: shipping.zipCode.replace(/\D/g, ""),
            street_name: shipping.street,
            street_number: parseInt(shipping.number) || 0,
            floor: "",
            apartment: shipping.complement || "",
            city_name: shipping.city,
            state_name: shipping.state,
          },
        },
        back_urls: {
          success: `${origin}/checkout/sucesso`,
          failure: `${origin}/checkout/erro`,
          pending: `${origin}/checkout/pendente`,
        },
        auto_return: "approved",
        external_reference: `order_${Date.now()}`,
        notification_url: `${origin}/api/mercadopago-webhook`,
        statement_descriptor: "VITZ",
      }),
    });

    if (!preferenceResponse.ok) {
      const errorData = await preferenceResponse.text();
      console.error("Mercado Pago error:", errorData);
      throw new Error(`Mercado Pago API error: ${preferenceResponse.status}`);
    }

    const preference = await preferenceResponse.json();

    return new Response(
      JSON.stringify({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
