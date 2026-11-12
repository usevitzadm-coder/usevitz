import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loadConsentPreferences, setConsentPreference, WHATSAPP_CONSENT_TEXT, type ConsentPreference } from "@/lib/marketing-consent";

export default function WhatsAppPreferences() {
  const [rows, setRows] = useState<ConsentPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();
  const load = async () => {
    setLoading(true); setFailed(false);
    try { setRows(await loadConsentPreferences()); } catch { setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const change = async (phone: string, checked: boolean) => {
    setSaving(phone);
    try {
      await setConsentPreference(phone, checked);
      setRows(current => current.map(row => row.phone === phone ? { ...row, whatsapp_opt_in: checked } : row));
      toast({ title: checked ? "WhatsApp autorizado" : "Você não receberá mais promoções pelo WhatsApp" });
    } catch { toast({ title: "Não foi possível salvar sua preferência", variant: "destructive" }); }
    finally { setSaving(null); }
  };
  return <section className="space-y-3 border-t border-border pt-4">
    <h3 className="text-sm font-medium">Receber novidades pelo WhatsApp</h3>
    {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : failed ? <Button variant="outline" onClick={load}>Tentar novamente</Button> : !rows.length ? <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado na sua conta ou nos seus pedidos.</p> : rows.map(row => <div key={row.phone} className="space-y-2">
      <Input aria-label="WhatsApp cadastrado" value={row.phone} readOnly />
      <label className="flex items-start gap-2 text-sm">
        <Checkbox aria-label={`Receber novidades pelo WhatsApp ${row.phone}`} checked={row.whatsapp_opt_in} disabled={saving !== null} onCheckedChange={v => void change(row.phone, v === true)} />
        <span>{WHATSAPP_CONSENT_TEXT}</span>
      </label>
    </div>)}
  </section>;
}