import { supabase } from "@/integrations/supabase/client";
export { WHATSAPP_CONSENT_TEXT, WHATSAPP_DEFAULT } from "../../supabase/functions/_shared/marketing-rules";
export type ConsentPreference = { phone: string; whatsapp_opt_in: boolean };
export async function submitMarketingConsent(input: { source: "gymrats" | "newsletter" | "cadastro" | "checkout"; phone?: string; name?: string; email: string; opt_in: boolean; accepted_terms?: boolean }) {
  const { data, error } = await supabase.functions.invoke("marketing-consent", { body: input });
  if (error || !data?.ok) throw new Error("Não foi possível salvar sua preferência de WhatsApp.");
}
export async function loadConsentPreferences(): Promise<ConsentPreference[]> {
  const { data, error } = await supabase.functions.invoke("marketing-consent", { body: { action: "preferences" } });
  if (error || !data?.customers) throw new Error("Não foi possível consultar suas preferências.");
  return data.customers;
}
export async function setConsentPreference(phone: string, opt_in: boolean) {
  const { data, error } = await supabase.functions.invoke("marketing-consent", { body: { action: "set_preference", phone, opt_in } });
  if (error || !data?.ok) throw new Error("Não foi possível salvar sua preferência.");
}