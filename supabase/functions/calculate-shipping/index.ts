import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingRequest {
  from: {
    postal_code: string;
  };
  to: {
    postal_code: string;
  };
  products: Array<{
    id: string;
    width: number;
    height: number;
    length: number;
    weight: number;
    quantity: number;
  }>;
}

interface ShippingOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company: {
    name: string;
    picture: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const melhorEnvioToken = Deno.env.get("MELHOR_ENVIO_TOKEN");
    const useSandbox = Deno.env.get("MELHOR_ENVIO_SANDBOX") === "true";

    if (!melhorEnvioToken) {
      console.error("MELHOR_ENVIO_TOKEN not configured");
      throw new Error("Serviço de frete não configurado");
    }

    const baseUrl = useSandbox 
      ? "https://sandbox.melhorenvio.com.br" 
      : "https://melhorenvio.com.br";

    const body: ShippingRequest = await req.json();
    console.log("Shipping calculation request:", JSON.stringify(body));

    // Validate required fields
    if (!body.from?.postal_code || !body.to?.postal_code || !body.products?.length) {
      throw new Error("Dados incompletos para cálculo de frete");
    }

    // Prepare request for Melhor Envio API
    const melhorEnvioBody = {
      from: {
        postal_code: body.from.postal_code.replace(/\D/g, ""),
      },
      to: {
        postal_code: body.to.postal_code.replace(/\D/g, ""),
      },
      products: body.products.map((p) => ({
        id: p.id,
        width: p.width || 15,
        height: p.height || 5,
        length: p.length || 20,
        weight: p.weight || 0.3,
        quantity: p.quantity || 1,
      })),
    };

    console.log("Sending to Melhor Envio:", JSON.stringify(melhorEnvioBody));

    console.log("Using API:", useSandbox ? "SANDBOX" : "PRODUCTION");

    const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${melhorEnvioToken}`,
        "User-Agent": "VitzStore (contato@usevitz.com)",
      },
      body: JSON.stringify(melhorEnvioBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Melhor Envio API error:", response.status, errorText);
      throw new Error(`Erro ao calcular frete: ${response.status}`);
    }

    const shippingData = await response.json();
    console.log("Melhor Envio response:", JSON.stringify(shippingData));

    // Allowed service IDs:
    // 1 = Correios PAC
    // 2 = Correios SEDEX
    // 3 = Jadlog .Package
    // 32 = Loggi Coleta (renamed to Standard)
    const allowedServiceIds = [1, 2, 3, 32];

    // Custom name mapping
    const nameOverrides: Record<number, string> = {
      32: "Standard", // Loggi Coleta -> Standard
    };

    // Filter only allowed services
    const validOptions = shippingData
      .filter((option: any) => {
        if (option.error || !option.price) return false;
        return allowedServiceIds.includes(option.id);
      })
      .map((option: any) => ({
        id: option.id,
        name: nameOverrides[option.id] || option.name,
        price: parseFloat(option.price),
        delivery_time: option.delivery_time,
        company: {
          name: option.company?.name || option.name,
          picture: option.company?.picture || "",
        },
      }));

    console.log("Valid shipping options (filtered):", validOptions.length);

    return new Response(
      JSON.stringify({ options: validOptions }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Error in calculate-shipping function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
