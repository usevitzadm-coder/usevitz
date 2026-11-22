import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { BLACK_WEEK } from '../_shared/blackweek.ts';
import { issueEarlyToken } from '../_shared/blackweek-token.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method !== 'POST') return reply({ error: 'Método não permitido' }, 405);
  try {
    const body = await req.json();
    const now = Date.now();
    if (body?.access !== 'grupo' || now < BLACK_WEEK.earlyStart || now >= BLACK_WEEK.publicStart) return reply({ token: null });
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!secret) return reply({ error: 'Acesso indisponível' }, 503);
    return reply({ token: await issueEarlyToken(secret), expiresAt: BLACK_WEEK.publicStart });
  } catch { return reply({ error: 'Solicitação inválida' }, 400); }
});
