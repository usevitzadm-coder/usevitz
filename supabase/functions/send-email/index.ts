import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "noreply@usevitz.com";

// Founders rotate as the "sender name"
const founders = ["Nick", "Nat", "Nady"];
function getFounderName(): string {
  return founders[Math.floor(Math.random() * founders.length)];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}

// ─── Email Templates ────────────────────────────────────────────

function baseLayout(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vitz</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9f5f0;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<!-- Header -->
<tr><td style="background-color:#1a1a1a;padding:24px 40px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:300;letter-spacing:4px;">VITZ</h1>
</td></tr>
<!-- Content -->
<tr><td style="padding:40px;">
${content}
</td></tr>
<!-- Footer -->
<tr><td style="background-color:#f5f0eb;padding:24px 40px;text-align:center;">
<p style="margin:0 0 8px;font-size:12px;color:#888;">Vitz Activewear — Vista-se de propósito</p>
<p style="margin:0;font-size:12px;color:#aaa;">Este é um email automático, por favor não responda.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function welcomeEmail(name: string, founderName: string): { subject: string; html: string } {
  return {
    subject: `Bem-vinda à Vitz, ${name}! 💛`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;">Olá, ${name}! 👋</h2>
      <p style="line-height:1.6;color:#444;">Que bom ter você com a gente! Eu sou a <strong>${founderName}</strong>, uma das fundadoras da Vitz.</p>
      <p style="line-height:1.6;color:#444;">A Vitz nasceu para mulheres que vivem em movimento. Cada peça é pensada com carinho para unir <strong>conforto, estilo e funcionalidade</strong> no seu dia a dia.</p>
      <p style="line-height:1.6;color:#444;">Explore nossa coleção e encontre peças que combinam com você!</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://usevitz.com" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Explorar Coleção</a>
      </div>
      <p style="line-height:1.6;color:#444;">Com carinho,<br><strong>${founderName}</strong> 💛<br><em>Co-fundadora da Vitz</em></p>
    `, `Bem-vinda à Vitz! Explore nossa coleção.`),
  };
}

interface OrderData {
  order_number: string;
  customer_name: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  gift_card_amount: number;
  total: number;
  shipping_method?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_cep: string;
  shipping_neighborhood?: string;
  coupon_code?: string;
  items?: Array<{ product_name: string; variant_info?: string; quantity: number; unit_price: number; total_price: number }>;
}

function orderItemsTable(items: OrderData["items"]): string {
  if (!items || items.length === 0) return "";
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">
        <strong>${i.product_name}</strong>${i.variant_info ? `<br><span style="color:#888;font-size:13px;">${i.variant_info}</span>` : ""}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(i.total_price)}</td>
    </tr>
  `).join("");
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr style="border-bottom:2px solid #1a1a1a;">
        <th style="text-align:left;padding:8px 0;font-size:13px;">Produto</th>
        <th style="text-align:center;padding:8px 0;font-size:13px;">Qtd</th>
        <th style="text-align:right;padding:8px 0;font-size:13px;">Total</th>
      </tr>
      ${rows}
    </table>`;
}

function orderSummary(order: OrderData): string {
  let s = `<div style="background:#f9f5f0;border-radius:8px;padding:16px;margin:16px 0;">`;
  s += `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>`;
  if (order.discount > 0) s += `<div style="color:#16a34a;"><span>Desconto${order.coupon_code ? ` (${order.coupon_code})` : ""}</span> <span>-${formatPrice(order.discount)}</span></div>`;
  if (order.gift_card_amount > 0) s += `<div style="color:#16a34a;"><span>Gift Card</span> <span>-${formatPrice(order.gift_card_amount)}</span></div>`;
  s += `<div><span>Frete${order.shipping_method ? ` (${order.shipping_method})` : ""}</span> <span>${order.shipping_cost === 0 ? "Grátis" : formatPrice(order.shipping_cost)}</span></div>`;
  s += `<div style="border-top:1px solid #ddd;margin-top:8px;padding-top:8px;font-weight:700;font-size:18px;"><span>Total</span> <span>${formatPrice(order.total)}</span></div>`;
  s += `</div>`;
  return s;
}

function shippingBlock(order: OrderData): string {
  return `<div style="background:#f9f5f0;border-radius:8px;padding:16px;margin:16px 0;">
    <h4 style="margin:0 0 8px;font-size:14px;">📍 Endereço de Entrega</h4>
    <p style="margin:0;font-size:14px;color:#444;">${order.shipping_address}${order.shipping_neighborhood ? `, ${order.shipping_neighborhood}` : ""}<br>${order.shipping_city} - ${order.shipping_state}<br>CEP: ${order.shipping_cep}</p>
  </div>`;
}

function orderConfirmationEmail(order: OrderData, founderName: string): { subject: string; html: string } {
  return {
    subject: `Pedido ${order.order_number} recebido! 🛒`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;">Pedido Recebido! ✨</h2>
      <p style="line-height:1.6;color:#444;">Oi, <strong>${order.customer_name}</strong>! Aqui é a <strong>${founderName}</strong> da Vitz.</p>
      <p style="line-height:1.6;color:#444;">Recebemos seu pedido <strong>${order.order_number}</strong> e estamos aguardando a confirmação do pagamento.</p>
      ${orderItemsTable(order.items)}
      ${orderSummary(order)}
      ${shippingBlock(order)}
      <p style="line-height:1.6;color:#444;">Assim que o pagamento for confirmado, você receberá outro email. 💛</p>
      <p style="line-height:1.6;color:#444;">Beijos,<br><strong>${founderName}</strong><br><em>Co-fundadora da Vitz</em></p>
    `, `Seu pedido ${order.order_number} foi recebido!`),
  };
}

function paymentApprovedEmail(order: OrderData, founderName: string): { subject: string; html: string } {
  return {
    subject: `Pagamento confirmado — Pedido ${order.order_number} ✅`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;">Pagamento Confirmado! 🎉</h2>
      <p style="line-height:1.6;color:#444;">Oi, <strong>${order.customer_name}</strong>! Aqui é a <strong>${founderName}</strong>.</p>
      <p style="line-height:1.6;color:#444;">O pagamento do seu pedido <strong>${order.order_number}</strong> foi <strong style="color:#16a34a;">aprovado</strong>! Já estamos preparando tudo com muito carinho.</p>
      ${orderItemsTable(order.items)}
      ${orderSummary(order)}
      <p style="line-height:1.6;color:#444;">Em breve você receberá a atualização de envio. 📦</p>
      <p style="line-height:1.6;color:#444;">Com amor,<br><strong>${founderName}</strong> 💛<br><em>Co-fundadora da Vitz</em></p>
    `, `Pagamento do pedido ${order.order_number} confirmado!`),
  };
}

function orderShippedEmail(order: OrderData, founderName: string): { subject: string; html: string } {
  return {
    subject: `Pedido ${order.order_number} enviado! 📦`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;">Seu Pedido Está a Caminho! 🚀</h2>
      <p style="line-height:1.6;color:#444;">Oi, <strong>${order.customer_name}</strong>! A <strong>${founderName}</strong> aqui!</p>
      <p style="line-height:1.6;color:#444;">Seu pedido <strong>${order.order_number}</strong> acabou de ser <strong>enviado</strong>! 🎉</p>
      ${shippingBlock(order)}
      <p style="line-height:1.6;color:#444;">Fique de olho na entrega! Qualquer coisa, estamos aqui.</p>
      <p style="line-height:1.6;color:#444;">Beijos,<br><strong>${founderName}</strong> 💛<br><em>Co-fundadora da Vitz</em></p>
    `, `Pedido ${order.order_number} enviado!`),
  };
}

function orderDeliveredEmail(order: OrderData, founderName: string): { subject: string; html: string } {
  return {
    subject: `Pedido ${order.order_number} entregue! 🎉`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;">Pedido Entregue! 💛</h2>
      <p style="line-height:1.6;color:#444;">Oi, <strong>${order.customer_name}</strong>! A <strong>${founderName}</strong> aqui!</p>
      <p style="line-height:1.6;color:#444;">Seu pedido <strong>${order.order_number}</strong> foi <strong>entregue</strong>! Esperamos que você ame cada peça. 😍</p>
      <p style="line-height:1.6;color:#444;">Se tiver qualquer dúvida ou feedback, adoraríamos ouvir de você!</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://usevitz.com" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Explorar Mais Peças</a>
      </div>
      <p style="line-height:1.6;color:#444;">Com carinho,<br><strong>${founderName}</strong> 💛<br><em>Co-fundadora da Vitz</em></p>
    `, `Seu pedido ${order.order_number} foi entregue!`),
  };
}

function orderCancelledEmail(order: OrderData, founderName: string): { subject: string; html: string } {
  return {
    subject: `Pedido ${order.order_number} cancelado`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;">Pedido Cancelado 😔</h2>
      <p style="line-height:1.6;color:#444;">Oi, <strong>${order.customer_name}</strong>. Aqui é a <strong>${founderName}</strong> da Vitz.</p>
      <p style="line-height:1.6;color:#444;">Infelizmente, seu pedido <strong>${order.order_number}</strong> foi <strong>cancelado</strong>.</p>
      <p style="line-height:1.6;color:#444;">Se houver algum reembolso pendente, ele será processado automaticamente. Caso tenha dúvidas, entre em contato conosco.</p>
      <p style="line-height:1.6;color:#444;">Esperamos ver você de volta em breve! 💛</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://usevitz.com" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Visitar a Loja</a>
      </div>
      <p style="line-height:1.6;color:#444;">Com carinho,<br><strong>${founderName}</strong><br><em>Co-fundadora da Vitz</em></p>
    `, `Pedido ${order.order_number} cancelado.`),
  };
}

function paymentRejectedEmail(order: OrderData, founderName: string): { subject: string; html: string } {
  return {
    subject: `Pagamento não aprovado — Pedido ${order.order_number}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:22px;">Pagamento Não Aprovado 😕</h2>
      <p style="line-height:1.6;color:#444;">Oi, <strong>${order.customer_name}</strong>. Aqui é a <strong>${founderName}</strong> da Vitz.</p>
      <p style="line-height:1.6;color:#444;">O pagamento do pedido <strong>${order.order_number}</strong> no valor de <strong>${formatPrice(order.total)}</strong> <strong style="color:#dc2626;">não foi aprovado</strong>.</p>
      <p style="line-height:1.6;color:#444;">Isso pode acontecer por diversos motivos. Sugerimos:</p>
      <ul style="color:#444;line-height:1.8;">
        <li>Verificar os dados do cartão</li>
        <li>Tentar outro método de pagamento</li>
        <li>Entrar em contato com seu banco</li>
      </ul>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://usevitz.com" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Tentar Novamente</a>
      </div>
      <p style="line-height:1.6;color:#444;">Estamos aqui se precisar de ajuda! 💛<br><strong>${founderName}</strong><br><em>Co-fundadora da Vitz</em></p>
    `, `Pagamento do pedido ${order.order_number} não aprovado.`),
  };
}

// ─── Email type mapping ─────────────────────────────────────────

type EmailType = "welcome" | "order_confirmation" | "payment_approved" | "payment_rejected" | "order_shipped" | "order_delivered" | "order_cancelled";

function getEmailContent(type: EmailType, data: any, founderName: string): { subject: string; html: string } | null {
  switch (type) {
    case "welcome":
      return welcomeEmail(data.name || "Cliente", founderName);
    case "order_confirmation":
      return orderConfirmationEmail(data as OrderData, founderName);
    case "payment_approved":
      return paymentApprovedEmail(data as OrderData, founderName);
    case "payment_rejected":
      return paymentRejectedEmail(data as OrderData, founderName);
    case "order_shipped":
      return orderShippedEmail(data as OrderData, founderName);
    case "order_delivered":
      return orderDeliveredEmail(data as OrderData, founderName);
    case "order_cancelled":
      return orderCancelledEmail(data as OrderData, founderName);
    default:
      return null;
  }
}

// ─── Main handler ───────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { type, to, data } = await req.json();

    if (!type || !to) {
      throw new Error("Missing required fields: type, to");
    }

    const founderName = getFounderName();
    const emailContent = getEmailContent(type as EmailType, data || {}, founderName);

    if (!emailContent) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${founderName} da Vitz <${FROM_EMAIL}>`,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", JSON.stringify(resData));
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(resData)}`);
    }

    console.log(`Email sent: type=${type}, to=${to}, id=${resData.id}`);

    return new Response(
      JSON.stringify({ success: true, id: resData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
