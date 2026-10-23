import { Link } from "react-router-dom";
import { MessageCircle, Dumbbell, Flame, Trophy, ArrowRight } from "lucide-react";
import logoVitz from "@/assets/logo-vitz.png";
import { Button } from "@/components/ui/button";

// TODO: substituir pelo link real do grupo
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/SEU-LINK-AQUI";

const ticker = ["Você está dentro", "#GymRatsDaGabi", "30 dias", "Constância", "Treina"];

const steps = [
  { n: "01", icon: MessageCircle, t: "Entra no grupo", d: "É lá que rola tudo: comunicações, ranking e o suporte da Gabi." },
  { n: "02", icon: Dumbbell, t: "Espera a largada", d: "A competição começa em 1º de novembro. Prepare o corpo." },
  { n: "03", icon: Trophy, t: "Disputa o prêmio", d: "Constância até o fim: conjunto Vitz e 20% OFF no pódio." },
];

const GymRatsThanks = () => (
  <div className="min-h-screen bg-background overflow-hidden flex flex-col">
    <header className="container flex items-center justify-between py-5">
      <Link to="/"><img src={logoVitz} alt="Vitz" className="h-24 md:h-32 w-auto scale-[2] origin-left" /></Link>
    </header>

    {/* Hero */}
    <section className="container relative pt-6 pb-16 md:pt-10 md:pb-20 text-center flex-1">
      <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-mint/40 blur-3xl" />
      <div className="absolute top-40 -right-24 w-80 h-80 rounded-full bg-primary/30 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-1.5 text-xs tracking-[0.25em] uppercase text-primary font-semibold animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary animate-pulse-ring" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Inscrição confirmada
        </span>

        <h1 className="font-serif leading-[0.85] mt-8">
          <span className="block text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight uppercase">
            Você
          </span>
          <span className="block text-7xl md:text-[10rem] lg:text-[12rem] italic text-primary -mt-2 md:-mt-4">
            está dentro!
          </span>
        </h1>
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mt-4">GymRats da Gabi</p>

        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mt-8">
          Falta um passo: entra no grupo oficial no WhatsApp. É lá que vão rolar as comunicações da
          competição, o ranking e as ideias de treino da Gabi.
        </p>

        <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-10">
          <Button size="lg" className="rounded-full px-10 h-14 text-base group">
            <MessageCircle className="mr-2 h-5 w-5" />
            Entrar no grupo
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

    {/* Próximos passos */}
    <section className="bg-foreground text-background py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <span className="text-sm tracking-[0.2em] uppercase text-primary font-medium">E agora?</span>
          <h2 className="font-serif text-4xl md:text-6xl mt-2">Seus próximos passos</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(({ n, icon: Icon, t, d }) => (
            <div key={n} className="group border-t border-background/20 pt-6 hover:border-primary transition-colors">
              <div className="flex items-center justify-between mb-4">
                <Icon className="text-primary group-hover:scale-110 transition-transform" size={28} />
                <span className="font-serif text-4xl text-primary/50">{n}</span>
              </div>
              <h3 className="font-serif text-2xl mb-2">{t}</h3>
              <p className="text-background/60">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default GymRatsThanks;
