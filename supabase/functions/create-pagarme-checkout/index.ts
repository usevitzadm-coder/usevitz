import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Extract user from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAnon.auth.getUser(token);
      userId = user?.id || null;
    }

    const {
      items,
      customer,
      shipping,
      shippingOption,
      paymentMethod,
      cardData,
      giftCardCode,
      giftCardDiscount: clientGiftCardDiscount = 0,
      couponCode,
      couponDiscount: clientCouponDiscount = 0,
    }: CheckoutRequest = await req.json();

    console.log("Processing Pagar.me checkout:", { paymentMethod, itemsCount: items.length, userId });

    // ===== SERVER-SIDE PRICE VALIDATION =====
    // Fetch real prices from database for all variants
    const variantIds = items.map(item => item.variant_id).filter(Boolean);
    const productIds = items.map(item => item.id);

    // Fetch products with their prices
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, price, is_active")
      .in("id", productIds);

    if (productsError || !dbProducts) {
      throw new Error("Failed to fetch product prices from database");
    }

    // Validate each item's price against the database
    let subtotal = 0;
    const validatedItems: CartItem[] = [];

    for (const item of items) {
      const dbProduct = dbProducts.find(p => p.id === item.id);
      if (!dbProduct) {
        throw new Error(`Product ${item.id} not found`);
      }
      if (!dbProduct.is_active) {
        throw new Error(`Product ${item.name} is no longer available`);
      }

      // Use the DATABASE price, not the client price
      const serverPrice = Number(dbProduct.price);
      
      if (Math.abs(serverPrice - item.price) > 0.01) {
        console.warn(`Price mismatch for ${item.name}: client=${item.price}, server=${serverPrice}`);
      }

      validatedItems.push({ ...item, price: serverPrice });
      subtotal += serverPrice * item.quantity;
    }

    console.log("Server-validated subtotal:", subtotal);

    // ===== SERVER-SIDE COUPON VALIDATION =====
    let couponDiscount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const validStart = !coupon.starts_at || new Date(coupon.starts_at) <= now;
        const validEnd = !coupon.expires_at || new Date(coupon.expires_at) > now;
        const validUses = !coupon.max_uses || coupon.used_count < coupon.max_uses;
        const validMin = !coupon.min_order_value || subtotal >= coupon.min_order_value;

        if (validStart && validEnd && validUses && validMin) {
          if (coupon.discount_type === "percentage") {
            couponDiscount = (subtotal * coupon.discount_value) / 100;
          } else {
            couponDiscount = Math.min(coupon.discount_value, subtotal);
          }
        }
      }
    }

    // ===== SERVER-SIDE GIFT CARD VALIDATION =====
    let giftCardDiscount = 0;
    if (giftCardCode && clientGiftCardDiscount > 0) {
      const normalizedCode = giftCardCode.replace(/[-\s]/g, "").toUpperCase();
      const formattedCode = normalizedCode.match(/.{1,4}/g)?.join("-") || normalizedCode;

      const { data: giftCard } = await supabase
        .from("gift_cards")
        .select("current_balance, is_active, expires_at")
        .eq("code", formattedCode)
        .single();

      if (giftCard && giftCard.is_active && new Date(giftCard.expires_at) > new Date()) {
        giftCardDiscount = Math.min(giftCard.current_balance, subtotal - couponDiscount);
      }
    }

    const shippingCost = shippingOption?.price || 0;
    const totalDiscounts = giftCardDiscount + couponDiscount;

    // For credit card with interest, use the totalWithInterest from cardData
    const hasInterest = paymentMethod === "credit_card" && cardData?.hasInterest;
    const baseTotal = Math.max(0, subtotal - totalDiscounts + shippingCost);
    
    // Validate interest calculation server-side
    let total = baseTotal;
    if (hasInterest && cardData?.totalWithInterest && cardData.installments > 1) {
      // Recalculate interest server-side
      const INTEREST_RATE = 0.0299;
      const n = cardData.installments;
      const coefficient = (INTEREST_RATE * Math.pow(1 + INTEREST_RATE, n)) / (Math.pow(1 + INTEREST_RATE, n) - 1);
      const serverInstallmentValue = baseTotal * coefficient;
      const serverTotalWithInterest = serverInstallmentValue * n;
      
      // Allow small rounding difference (max R$0.10)
      if (Math.abs(serverTotalWithInterest - cardData.totalWithInterest) > 0.10) {
        console.warn(`Interest total mismatch: client=${cardData.totalWithInterest}, server=${serverTotalWithInterest}`);
      }
      total = serverTotalWithInterest;
    }

    const totalInCents = Math.round(total * 100);

    console.log("Server-validated totals:", { subtotal, shippingCost, couponDiscount, giftCardDiscount, baseTotal, total, totalInCents, hasInterest });

    // Prepare items for Pagar.me (using validated server prices)
    // NOTE: Do NOT add shipping here - it goes in the shipping.amount field
    const orderItems = validatedItems.map((item) => ({
      code: item.id,
      description: `${item.name}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`,
      amount: Math.round(item.price * 100),
      quantity: item.quantity,
    }));

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
        amount: totalInCents,
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
        amount: totalInCents,
        pix: {
          expires_in: 3600,
        },
      };
    } else if (paymentMethod === "boleto") {
      payment = {
        payment_method: "boleto",
        amount: totalInCents,
        boleto: {
          instructions: "Pagar até o vencimento",
          due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
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

    // Create order in database (with server-validated values)
    const orderNumber = `VITZ-${Date.now().toString(36).toUpperCase()}`;
    const paymentStatus = charge.status === "paid" ? "approved" : "pending";

    const orderData: any = {
      order_number: orderNumber,
      user_id: userId,
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

      // Create order items (with server-validated prices)
      const orderItemsData = validatedItems.map((item) => ({
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
    if (giftCardCode && giftCardDiscount > 0 && orderRecord) {
      const normalizedCode = giftCardCode.replace(/[-\s]/g, "").toUpperCase();
      const formattedCode = normalizedCode.match(/.{1,4}/g)?.join("-") || normalizedCode;
      
      // Deduct from gift card balance
      const { data: gc } = await supabase
        .from("gift_cards")
        .select("id, current_balance")
        .eq("code", formattedCode)
        .single();

      if (gc) {
        await supabase
          .from("gift_cards")
          .update({ current_balance: gc.current_balance - giftCardDiscount })
          .eq("id", gc.id);

        await supabase
          .from("gift_card_transactions")
          .insert({
            gift_card_id: gc.id,
            amount: -giftCardDiscount,
            type: "redemption",
            order_id: orderRecord.id,
            notes: `Used on order ${orderNumber}`,
          });
      }
    }

    // Increment coupon usage if applied
    if (couponCode && couponDiscount > 0) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("id, used_count")
        .eq("code", couponCode.toUpperCase().trim())
        .single();

      if (coupon) {
        await supabase
          .from("coupons")
          .update({ used_count: coupon.used_count + 1 })
          .eq("id", coupon.id);
      }
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
