import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Trophy, Users, Dumbbell, Flame, ArrowRight } from "lucide-react";
import logoVitz from "@/assets/logo-vitz.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido"),
});

const START = new Date("2026-11-01T00:00:00-03:00").getTime();
const END = new Date("2026-11-30T23:59:59-03:00").getTime();

const useCountdown = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const started = now >= START;
  const diff = Math.max(0, (started ? END : START) - now);
  return {
    started,
    parts: [
      { v: Math.floor(diff / 86400000), l: "dias" },
      { v: Math.floor(diff / 3600000) % 24, l: "horas" },
      { v: Math.floor(diff / 60000) % 60, l: "min" },
      { v: Math.floor(diff / 1000) % 60, l: "seg" },
    ],
  };
};

const podium = [
  { place: "2º", prize: "20% OFF", h: "h-28 md:h-36" },
  { place: "1º", prize: "Conjunto Vitz + 20% OFF", h: "h-40 md:h-52", top: true },
  { place: "3º", prize: "20% OFF", h: "h-20 md:h-28" },
];

const ticker = ["Treine", "Registre", "Suba no ranking", "Conquiste", "#GymRatsDaGabi"];

const terms = [
  {
    t: "1. A competição",
    d: "O GymRats da Gabi by Vitz é uma competição de constância em treinos realizada durante o mês de novembro. O ranking e a pontuação são apurados pela plataforma do aplicativo terceiro GymRats, responsável pelo registro e pela classificação das participantes.",
  },
  {
    t: "2. Comunicações",
    d: "O grupo oficial no WhatsApp é o canal de comunicação entre as participantes, a Gabi e a Vitz. Nele serão compartilhados avisos da competição, ideias de treino e conteúdos de saúde e bem-estar.",
  },
  {
    t: "3. Seus dados (LGPD)",
    d: "A Vitz armazena seu nome, e-mail e telefone exclusivamente para a organização da competição e para as comunicações que você autorizar. Seus dados não serão compartilhados com terceiros, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
  },
  {
    t: "4. Premiação",
    d: "Os prêmios são disponibilizados pelo WhatsApp da Vitz por meio da geração de cupons. Cada cupom é válido por 30 dias a partir da data de disponibilização. A Vitz não se responsabiliza por cupons não utilizados após o prazo de validade.",
  },
];

const GymRats = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { started, parts } = useCountdown();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os termos da competição para participar.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("gymrats_signups").insert({
      ...parsed.data,
      marketing_opt_in: marketingOptIn,
    } as any);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível concluir sua inscrição. Tente novamente.");
      return;
    }
    navigate("/gymrats/obrigada");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="container flex items-center justify-between py-5">
        <Link to="/"><img src={logoVitz} alt="Vitz" className="h-24 md:h-32 w-auto scale-[2] origin-left" /></Link>
        <a href="#inscricao">
          <Button size="sm" className="rounded-full">Participar</Button>
        </a>
      </header>

      {/* Hero */}
      <section className="container relative pt-6 pb-16 md:pt-10 md:pb-24 text-center">
        <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-mint/40 blur-3xl" />
        <div className="absolute top-40 -right-24 w-80 h-80 rounded-full bg-primary/30 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-1.5 text-xs tracking-[0.25em] uppercase text-primary font-semibold animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary animate-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Competição · Novembro
          </span>

          <h1 className="font-serif leading-[0.85] mt-8">
            <span className="block text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight uppercase">
              GymRats
            </span>
            <span className="block text-7xl md:text-[10rem] lg:text-[12rem] italic text-primary -mt-2 md:-mt-4">
              da Gabi
            </span>
          </h1>
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mt-4">by Vitz</p>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mt-8">
            30 dias. Um ranking. Muita constância. Treine com a Gabi durante todo o mês de novembro e dispute prêmios exclusivos.
          </p>

          {/* Countdown */}
          <div className="mt-10">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
              {started ? "A competição termina em" : "A largada é em"}
            </p>
            <div className="flex justify-center gap-3 md:gap-5">
              {parts.map((p) => (
                <div key={p.l} className="bg-foreground text-background w-16 md:w-24 py-3 md:py-4 rounded-xl shadow-elegant">
                  <div className="font-serif text-3xl md:text-5xl tabular-nums">{String(p.v).padStart(2, "0")}</div>
                  <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-70">{p.l}</div>
                </div>
              ))}
            </div>
          </div>

          <a href="#inscricao" className="inline-block mt-10">
            <Button size="lg" className="rounded-full px-10 h-14 text-base group">
              Quero competir
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </div>
      </section>

      {/* Ticker */}
      <div className="bg-primary text-primary-foreground py-4 -rotate-1 scale-105">
        <div className="flex w-max animate-marquee">
          {[...Array(2)].flatMap((_, i) =>
            [...ticker, ...ticker].map((t, j) => (
              <span key={`${i}-${j}`} className="flex items-center gap-6 px-6 font-serif text-2xl md:text-3xl uppercase whitespace-nowrap">
                {t} <Flame size={22} />
              </span>
            ))
          )}
        </div>
      </div>

      {/* Podium */}
      <section className="container py-20 md:py-28">
        <div className="text-center mb-14">
          <span className="text-sm tracking-[0.2em] uppercase text-primary font-medium">Premiação</span>
          <h2 className="font-serif text-4xl md:text-6xl mt-2">Suba no pódio</h2>
        </div>
        <div className="flex items-end justify-center gap-3 md:gap-6 max-w-3xl mx-auto">
          {podium.map((p) => (
            <div key={p.place} className="flex-1 flex flex-col items-center">
              {p.top && <Trophy className="text-primary mb-3 animate-bounce" size={40} />}
              <p className="text-center text-sm md:text-base font-medium mb-3 px-1">{p.prize}</p>
              <div className={`w-full ${p.h} rounded-t-2xl flex items-start justify-center pt-4 ${p.top ? "bg-primary text-primary-foreground" : "bg-mint text-foreground"}`}>
                <span className="font-serif text-4xl md:text-6xl">{p.place}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground mt-8">
          4º e 5º lugares também ganham <strong className="text-foreground">20% OFF</strong>
        </p>
      </section>

      {/* How it works */}
      <section className="bg-foreground text-background py-20 md:py-28">
        <div className="container grid md:grid-cols-3 gap-10">
          {[
            { n: "01", icon: Users, t: "Inscreva-se", d: "Preencha seus dados e entre no grupo oficial no WhatsApp." },
            { n: "02", icon: Dumbbell, t: "Treine com a Gabi", d: "Receba ideias de treino e dicas de saúde durante todo o mês." },
            { n: "03", icon: Trophy, t: "Conquiste", d: "Registre sua constância, suba no ranking e garanta seu prêmio." },
          ].map(({ n, icon: Icon, t, d }) => (
            <div key={n} className="group border-t border-background/20 pt-6 hover:border-primary transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-5xl text-primary">{n}</span>
                <Icon className="opacity-60 group-hover:opacity-100 group-hover:scale-110 transition" size={28} />
              </div>
              <h3 className="font-serif text-2xl mb-2">{t}</h3>
              <p className="text-background/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section id="inscricao" className="container py-20 md:py-28">
        <form onSubmit={submit} className="relative max-w-xl mx-auto bg-card border-2 border-primary rounded-3xl p-8 md:p-12 space-y-5 shadow-elegant">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-mint text-foreground text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Vagas abertas
          </span>
          <h2 className="font-serif text-4xl text-center">Bora pro desafio?</h2>
          <p className="text-center text-muted-foreground">Inscreva-se e receba o link do grupo da Gabi no WhatsApp.</p>
          <Input className="h-12" placeholder="Seu nome" maxLength={100} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input className="h-12" type="email" placeholder="Seu melhor e-mail" maxLength={255} value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input className="h-12" type="tel" placeholder="WhatsApp com DDD" maxLength={20} value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer text-sm text-muted-foreground">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <span>
                Li e aceito os{" "}
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="underline font-medium text-foreground hover:text-primary transition-colors">
                      termos da competição
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-2xl">Termos da Competição</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 mt-2">
                      {terms.map((item) => (
                        <div key={item.t}>
                          <h3 className="font-semibold mb-1">{item.t}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.d}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                {" "}do GymRats da Gabi by Vitz. <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-sm text-muted-foreground">
              <Checkbox
                checked={marketingOptIn}
                onCheckedChange={(v) => setMarketingOptIn(v === true)}
                className="mt-0.5"
              />
              <span>
                Quero receber novidades, lançamentos e ofertas da Vitz por e-mail e WhatsApp. (opcional)
              </span>
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full h-14 rounded-full text-base" disabled={loading}>
            {loading ? "Enviando..." : "Quero participar"}
          </Button>
        </form>
      </section>
    </div>
  );
};

export default GymRats;
