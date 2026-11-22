import { BLACK_WEEK } from './blackweek.ts';
const encoder = new TextEncoder();
async function signingKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(`vitz-blackweek-access:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function issueEarlyToken(secret: string) {
  const payload = `blackweek-2026.${BLACK_WEEK.publicStart}`;
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifyEarlyToken(token: unknown, secret: string, now: number) {
  if (now < BLACK_WEEK.earlyStart || now >= BLACK_WEEK.publicStart || typeof token !== 'string') return false;
  const [campaign, expires, signature, extra] = token.split('.');
  if (extra || campaign !== 'blackweek-2026' || expires !== String(BLACK_WEEK.publicStart) || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/.{2}/g) || [], hex => parseInt(hex, 16));
  return crypto.subtle.verify('HMAC', await signingKey(secret), bytes, encoder.encode(`${campaign}.${expires}`));
}
