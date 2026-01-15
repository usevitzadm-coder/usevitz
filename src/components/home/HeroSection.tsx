import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-yoga.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Vitz lifestyle - Modelos praticando yoga com roupas fitness premium"
          className="w-full h-full object-cover object-[center_55%] md:object-[center_50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="vitz-container relative z-10">
        <div className="max-w-xl space-y-6 animate-slide-up">
          <span className="vitz-label text-primary">Nova Coleção 2025</span>
          <h1 className="vitz-heading-xl text-foreground">
            Movimento é <br />
            <span className="text-primary">Vida</span>
          </h1>
          <p className="vitz-body text-muted-foreground max-w-md">
            Roupas fitness premium desenvolvidas para quem vive em movimento. 
            Conforto, performance e estilo em cada peça.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/colecao/feminino">Comprar Agora</Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/novidades">Ver Novidades</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
