import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  variant_id?: string;
}

interface CustomerData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

interface ShippingData {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CardData {
  number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
  installments: number;
  totalWithInterest?: number;
  hasInterest?: boolean;
}

interface CheckoutRequest {
  items: CartItem[];
  customer: CustomerData;
  shipping: ShippingData;
  shippingOption?: {
    id: number;
    name: string;
    price: number;
    delivery_time: number;
  };
  paymentMethod: "credit_card" | "pix" | "boleto";
  cardData?: CardData;
  giftCardCode?: string;
  giftCardDiscount?: number;
  couponCode?: string;
  couponDiscount?: number;
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

    const {
      items,
      customer,
      shipping,
      shippingOption,
      paymentMethod,
      cardData,
      giftCardCode,
      giftCardDiscount = 0,
      couponCode,
      couponDiscount = 0,
    }: CheckoutRequest = await req.json();

    console.log("Processing Pagar.me checkout:", { paymentMethod, itemsCount: items.length });

    // Calculate totals
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = shippingOption?.price || 0;
    const totalDiscounts = giftCardDiscount + couponDiscount;
    
    // For credit card with interest, use the totalWithInterest from cardData
    const hasInterest = paymentMethod === "credit_card" && cardData?.hasInterest;
    const baseTotal = Math.max(0, subtotal - totalDiscounts + shippingCost);
    const total = hasInterest && cardData?.totalWithInterest ? cardData.totalWithInterest : baseTotal;
    const totalInCents = Math.round(total * 100);

    console.log("Order totals:", { subtotal, shippingCost, totalDiscounts, baseTotal, total, totalInCents, hasInterest });

    // Prepare items for Pagar.me
    const orderItems = items.map((item) => ({
      code: item.id,
      description: `${item.name}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`,
      amount: Math.round(item.price * 100),
      quantity: item.quantity,
    }));

    // Add shipping as item if applicable
    if (shippingOption && shippingOption.price > 0) {
      orderItems.push({
        code: "shipping",
        description: `Frete - ${shippingOption.name}`,
        amount: Math.round(shippingOption.price * 100),
        quantity: 1,
      });
    }

    // Parse phone
    const phoneDigits = customer.phone.replace(/\D/g, "");
    const areaCode = phoneDigits.substring(0, 2);
    const phoneNumber = phoneDigits.substring(2);

    // Build customer object for Pagar.me
    const pagarmeCustomer = {
      name: customer.name,
      email: customer.email,
      document: customer.cpf.replace(/\D/g, ""),
      document_type: "CPF",
      type: "individual",
      phones: {
        mobile_phone: {
          country_code: "55",
          area_code: areaCode,
          number: phoneNumber,
        },
      },
    };

    // Build shipping address
    const shippingAddress = {
      line_1: `${shipping.number}, ${shipping.street}`,
      line_2: shipping.complement || "",
      zip_code: shipping.zipCode.replace(/\D/g, ""),
      city: shipping.city,
      state: shipping.state,
      country: "BR",
    };

    // Build payment object based on method
    let payment: any;
    const externalReference = `order_${Date.now()}`;

    if (paymentMethod === "credit_card" && cardData) {
      payment = {
        payment_method: "credit_card",
        credit_card: {
          installments: cardData.installments || 1,
          statement_descriptor: "VITZ",
          card: {
            number: cardData.number.replace(/\D/g, ""),
            holder_name: cardData.holder_name.toUpperCase(),
            exp_month: cardData.exp_month,
            exp_year: cardData.exp_year,
            cvv: cardData.cvv,
            billing_address: shippingAddress,
          },
        },
      };
    } else if (paymentMethod === "pix") {
      payment = {
        payment_method: "pix",
        pix: {
          expires_in: 3600, // 1 hour
        },
      };
    } else if (paymentMethod === "boleto") {
      payment = {
        payment_method: "boleto",
        boleto: {
          instructions: "Pagar até o vencimento",
          due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        },
      };
    } else {
      throw new Error("Invalid payment method");
    }

    // Create order in Pagar.me
    const orderBody = {
      items: orderItems,
      customer: pagarmeCustomer,
      shipping: {
        amount: Math.round(shippingCost * 100),
        description: shippingOption?.name || "Frete",
        address: shippingAddress,
      },
      payments: [payment],
      code: externalReference,
      closed: true,
    };

    console.log("Creating Pagar.me order...");

    const pagarmeResponse = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(apiKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderBody),
    });

    const responseText = await pagarmeResponse.text();
    console.log("Pagar.me response status:", pagarmeResponse.status);

    if (!pagarmeResponse.ok) {
      console.error("Pagar.me error response:", responseText);
      throw new Error(`Pagar.me API error: ${pagarmeResponse.status} - ${responseText}`);
    }

    const pagarmeOrder = JSON.parse(responseText);
    console.log("Pagar.me order created:", pagarmeOrder.id);

    // Get charge details
    const charge = pagarmeOrder.charges?.[0];
    if (!charge) {
      throw new Error("No charge created");
    }

    // Prepare response based on payment method
    let responseData: any = {
      orderId: pagarmeOrder.id,
      chargeId: charge.id,
      status: charge.status,
      paymentMethod,
    };

    if (paymentMethod === "pix" && charge.last_transaction?.qr_code) {
      responseData.pixQrCode = charge.last_transaction.qr_code;
      responseData.pixQrCodeUrl = charge.last_transaction.qr_code_url;
      responseData.pixExpiresAt = charge.last_transaction.expires_at;
    } else if (paymentMethod === "boleto" && charge.last_transaction?.url) {
      responseData.boletoUrl = charge.last_transaction.url;
      responseData.boletoBarcode = charge.last_transaction.line;
      responseData.boletoDueDate = charge.last_transaction.due_at;
      responseData.boletoPdf = charge.last_transaction.pdf;
    } else if (paymentMethod === "credit_card") {
      responseData.approved = charge.status === "paid";
    }

    // Create order in database
    const orderNumber = `VITZ-${Date.now().toString(36).toUpperCase()}`;
    const paymentStatus = charge.status === "paid" ? "approved" : "pending";
    
    const orderData = {
      order_number: orderNumber,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      customer_document: customer.cpf.replace(/\D/g, "") || null,
      shipping_address: `${shipping.street}, ${shipping.number}${shipping.complement ? ` - ${shipping.complement}` : ""}`,
      shipping_neighborhood: shipping.neighborhood || null,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_cep: shipping.zipCode.replace(/\D/g, ""),
      shipping_method: shippingOption?.name || null,
      shipping_cost: shippingCost,
      subtotal: subtotal,
      discount: couponDiscount,
      gift_card_amount: giftCardDiscount,
      total: total,
      status: "pending",
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_id: pagarmeOrder.id,
      coupon_code: couponCode || null,
    };

    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order record:", orderError);
    } else {
      console.log("Order record created:", orderRecord.id);

      // Create order items
      const orderItemsData = items.map((item) => ({
        order_id: orderRecord.id,
        product_id: item.id,
        variant_id: item.variant_id || null,
        product_name: item.name,
        variant_info: `${item.color || ""}${item.color && item.size ? " / " : ""}${item.size || ""}` || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
      }

      responseData.internalOrderId = orderRecord.id;
    }

    // Handle gift card discount if applied
    if (giftCardCode && giftCardDiscount > 0) {
      // Deduct from gift card balance
      const { error: giftCardError } = await supabase.rpc("use_gift_card", {
        p_code: giftCardCode,
        p_amount: giftCardDiscount,
        p_order_id: orderRecord?.id || null,
      });

      if (giftCardError) {
        console.error("Error updating gift card:", giftCardError);
      }
    }

    // Increment coupon usage if applied
    if (couponCode) {
      await supabase
        .from("coupons")
        .update({ used_count: supabase.rpc("increment_used_count") })
        .eq("code", couponCode);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating Pagar.me checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
