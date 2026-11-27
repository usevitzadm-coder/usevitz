import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  needsAnswer,
  onConsentChange,
  readChoice,
  saveChoices,
  type Purpose,
} from "@/lib/consent";

const PURPOSES: Purpose[] = ["analytics", "advertising"];
const OPEN_SETTINGS_EVENT = "vitz:open-cookie-settings";

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const globalPrivacyControl = typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

  const refresh = async () => {
    setAnalytics(readChoice("analytics") === "granted");
    setAdvertising(readChoice("advertising") === "granted");
    setVisible(await needsAnswer(PURPOSES));
  };

  useEffect(() => {
    void refresh();
    const unsubscribe = onConsentChange(() => void refresh());
    const openSettings = () => {
      setAnalytics(readChoice("analytics") === "granted");
      setAdvertising(readChoice("advertising") === "granted");
      setSettingsOpen(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => {
      unsubscribe();
      window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
    };
  }, []);

  useEffect(() => {
    if (visible) panelRef.current?.focus();
  }, [visible, settingsOpen]);

  const close = () => {
    setVisible(false);
    setSettingsOpen(false);
  };

  const answerAll = (choice: "granted" | "denied") => {
    saveChoices({ analytics: choice, advertising: choice });
    close();
  };

  const saveSettings = () => {
    saveChoices({
      analytics: analytics ? "granted" : "denied",
      advertising: advertising ? "granted" : "denied",
    });
    close();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] flex justify-center pointer-events-none md:inset-x-6 md:bottom-6">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="region"
        aria-label="Preferências de privacidade"
        className="pointer-events-auto w-full max-w-2xl rounded-lg border border-border bg-background/95 p-5 text-foreground shadow-xl backdrop-blur focus:outline-none md:p-6"
      >
        {!settingsOpen ? (
          <>
            <h2 className="font-heading text-xl font-semibold">Sua privacidade</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Contamos visitas sem identificar você. Se aceitar, também medimos cliques e outras ações.
              Com sua permissão, usamos cookies de publicidade para medir resultados e personalizar anúncios.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Saiba mais na <Link to="/privacidade" className="underline underline-offset-2">Política de Privacidade</Link>.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="flex-1" onClick={() => answerAll("granted")}>
                Aceitar todos
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => answerAll("denied")}>
                Recusar todos
              </Button>
            </div>
            <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setSettingsOpen(true)}>
              Configurações de cookies
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-heading text-xl font-semibold">Configurações de cookies</h2>
            {globalPrivacyControl && (
              <p className="mt-2 text-sm text-muted-foreground">
                O sinal de privacidade do seu navegador está ativo e será respeitado.
              </p>
            )}
            <div className="mt-4 divide-y divide-border rounded-md border border-border">
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Necessários</p>
                  <p className="text-sm text-muted-foreground">Recursos essenciais para o site funcionar.</p>
                </div>
                <span className="text-sm text-muted-foreground">Sempre ativos</span>
              </div>
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Análise, fornecida pela Lovable</p>
                  <p className="text-sm text-muted-foreground">Medição de visitas, cliques e uso do site.</p>
                </div>
                <Switch
                  aria-label="Permitir análise"
                  checked={!globalPrivacyControl && analytics}
                  disabled={globalPrivacyControl}
                  onCheckedChange={setAnalytics}
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Publicidade, fornecida pela Meta</p>
                  <p className="text-sm text-muted-foreground">Medição de campanhas, personalização e remarketing.</p>
                </div>
                <Switch
                  aria-label="Permitir publicidade"
                  checked={!globalPrivacyControl && advertising}
                  disabled={globalPrivacyControl}
                  onCheckedChange={setAdvertising}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" className="flex-1" onClick={close}>
                Fechar
              </Button>
              <Button type="button" className="flex-1" disabled={globalPrivacyControl} onClick={saveSettings}>
                Salvar escolhas
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
