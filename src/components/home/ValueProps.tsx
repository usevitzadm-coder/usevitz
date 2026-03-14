import { useEffect, useCallback } from "react";
import { Truck, CreditCard, Shield, Sparkles, Sun } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const benefits = [
  {
    icon: Truck,
    title: "Frete Grátis p/ Sudeste",
    description: "Em compras acima de R$239,90",
  },
  {
    icon: CreditCard,
    title: "Parcele em até 3x s/ juros",
    description: "No cartão de crédito",
  },
  {
    icon: Sun,
    title: "Peças com proteção UV",
    description: "Linhas Daily e Essential com UV 50+",
  },
  {
    icon: Shield,
    title: "Compra Segura",
    description: "Seus dados 100% protegidos",
  },
  {
    icon: Sparkles,
    title: "Qualidade Premium",
    description: "Materiais de alta performance",
  },
];

const BenefitItem = ({ icon: Icon, title, description }: { icon: typeof Truck; title: string; description: string }) => (
  <div className="text-center space-y-2">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary">
      <Icon size={24} className="text-secondary-foreground" />
    </div>
    <h3 className="font-medium text-sm">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const ValueProps = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: "start",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  return (
    <section className="py-10 md:py-16 border-y border-border">
      <div className="vitz-container">
        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <BenefitItem key={index} {...benefit} />
          ))}
        </div>

        {/* Mobile: Carousel showing 2 at a time */}
        <div className="md:hidden overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 w-1/2 px-2"
              >
                <BenefitItem {...benefit} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
