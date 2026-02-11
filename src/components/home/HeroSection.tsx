import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-yoga.jpg";
const HeroSection = () => {
  return <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Vitz lifestyle - Modelos praticando yoga com roupas fitness premium" className="w-full h-full object-cover object-[center_55%] md:object-[center_50%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
      </div>

      {/* Content */}
      <div className="vitz-container relative z-10">
        <div className="max-w-xl space-y-6 animate-slide-up [text-shadow:_0_2px_12px_rgb(0_0_0_/_20%)]">
          <span className="vitz-label text-primary bg-secondary-foreground">Nova Coleção 2026</span>
          <h1 className="vitz-heading-xl text-foreground">
            Movimento é Vida.   <br />
            <span className="text-primary bg-secondary-foreground">Movimento é Vitz.</span>
          </h1>
          <p className="vitz-body text-foreground/75 max-w-md">
            Roupas fitness premium desenvolvidas para quem vive em movimento. 
            Conforto, performance e estilo em cada peça.
          </p>
          <div className="pt-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/produtos">Ver Produtos</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;