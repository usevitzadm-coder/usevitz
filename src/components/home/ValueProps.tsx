import { Truck, RefreshCw, Shield, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Frete Grátis",
    description: "Em compras acima de R$ 299",
  },
  {
    icon: RefreshCw,
    title: "Troca Fácil",
    description: "Primeira troca grátis",
  },
  {
    icon: Shield,
    title: "Compra Segura",
    description: "Seus dados protegidos",
  },
  {
    icon: Sparkles,
    title: "Qualidade Premium",
    description: "Materiais de alta performance",
  },
];

const ValueProps = () => {
  return (
    <section className="py-16 border-y border-border">
      <div className="vitz-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center space-y-3"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary">
                <benefit.icon size={24} className="text-secondary-foreground" />
              </div>
              <h3 className="font-medium text-sm">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
