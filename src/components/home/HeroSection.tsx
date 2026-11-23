import { useBlackWeek } from "@/context/BlackWeekContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-yoga.jpg";
const HeroSection = () => {
  const { theme } = useBlackWeek();
  if (theme) return <section className="relative min-h-[65vh] md:min-h-[70vh] flex items-center overflow-hidden">
    <img src={heroImage} alt="Duas modelos com conjuntos Vitz" className="absolute inset-0 w-full h-full object-cover object-center" fetchPriority="high" />
    <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/20" />
    <div className="vitz-container relative py-12"><div className="max-w-xl space-y-5">
      <p className="text-sm text-primary">VITZ · 26—30 NOVEMBRO</p>
      <h1 className="text-6xl md:text-8xl font-heading">Black <em className="text-primary">Week</em></h1>
      <p className="text-xl md:text-2xl">Compre 1 peça, leve 2.</p>
      <p className="text-muted-foreground">A cada par de roupas, a peça de menor valor sai grátis. Conjuntos formam pares entre si primeiro; depois, as peças avulsas. Acessórios não participam.</p>
      <Button variant="hero" size="lg" asChild><Link to="/produtos">Montar meu par</Link></Button>
      <p className="text-xs text-muted-foreground">Até 3x sem juros · Não acumulativo com cupons</p>
    </div></div>
  </section>;
  return <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Vitz lifestyle - Modelos praticando yoga com roupas fitness premium" className="w-full h-full object-cover object-[center_55%] md:object-[center_50%]" fetchPriority="high" />
        <div className="absolute inset-0 bg-background/65 md:bg-transparent md:bg-gradient-to-r md:from-background/95 md:via-background/75 md:to-background/30" />
      </div>

      {/* Content */}
      <div className="vitz-container relative z-10">
        <div className="max-w-xl space-y-6 animate-slide-up [text-shadow:_0_2px_12px_rgb(0_0_0_/_20%)]">
          <span className="vitz-label text-primary bg-secondary-foreground">Nova Coleção 2026</span>
          <h1 className="vitz-heading-xl text-foreground">
            Movimento é Vida.   <br />
            <span className="text-primary bg-secondary-foreground">Movimento é Vitz.</span>
          </h1>
          <p className="vitz-body text-foreground/75 max-w-md font-medium">
            Roupas fitness premium desenvolvidas para quem vive em movimento. 
            Conforto, performance e estilo em cada peça.
          </p>
          <div className="pt-4">
            <Button variant="hero" size="lg" className="md:h-16 md:px-12 md:text-lg" asChild>
              <Link to="/produtos">Ver Produtos</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;