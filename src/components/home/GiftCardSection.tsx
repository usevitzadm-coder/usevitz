import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import giftCardImage from "@/assets/giftcard-vitz.avif";

const GiftCardSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="vitz-container">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Image */}
          <div className="relative order-2 md:order-1">
            <div className="relative overflow-hidden rounded-sm">
              <img
                src={giftCardImage}
                alt="Gift Card Vitz - Presente perfeito para quem ama fitness"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 md:order-2 flex flex-col items-start">
            <span className="vitz-label text-primary mb-4 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Gift Card
            </span>
            
            <h2 className="vitz-heading-lg text-foreground mb-4">
              O presente perfeito
            </h2>
            
            <p className="vitz-body text-muted-foreground mb-6 max-w-md">
              Dê o presente da escolha. Com o Gift Card Vitz, quem você ama escolhe 
              as peças que mais combinam com seu estilo e rotina de treinos.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Valores de R$ 100 a R$ 500
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Válido por 12 meses
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Envio digital instantâneo
              </li>
            </ul>

            <Button asChild size="lg" className="group">
              <Link to="/gift-card">
                Comprar Gift Card
                <Gift className="ml-2 w-4 h-4 transition-transform group-hover:scale-110" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiftCardSection;
