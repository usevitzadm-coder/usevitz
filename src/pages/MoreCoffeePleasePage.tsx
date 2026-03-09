import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Coffee, Gift, ShoppingBag } from "lucide-react";
import productImage from "@/assets/product-legging-1.jpg";

const steps = [
  {
    icon: ShoppingBag,
    title: "Escolha sua peça",
    description: "Navegue pela coleção e escolha qualquer peça na cor Coffee.",
  },
  {
    icon: Coffee,
    title: "Finalize sua compra",
    description: "Adicione ao carrinho e finalize normalmente.",
  },
  {
    icon: Gift,
    title: "Ganhe seu drip coffee",
    description: "Receba um drip coffee exclusivo da Fera Café junto com seu pedido!",
  },
];

const MoreCoffeePleasePage = () => {
  return (
    <Layout>
      <Helmet>
        <title>More Coffee, Please! | Vitz</title>
        <meta
          name="description"
          content="Promoção More Coffee, Please! Compre qualquer peça na cor Coffee e ganhe um drip coffee exclusivo da Fera Café."
        />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#f5ead6" }}>
        <div className="vitz-container py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Text */}
            <div className="flex-1 text-center md:text-left space-y-6 order-2 md:order-1">
              <span className="vitz-label text-primary">Promoção Especial</span>
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-light italic tracking-tight"
                style={{ fontFamily: "var(--font-heading)", color: "hsl(30 10% 15%)" }}
              >
                More Coffee,
                <br />
                <span className="text-primary">please!</span>
              </h1>
              <p className="vitz-body max-w-md mx-auto md:mx-0 text-foreground/80">
                Compre qualquer peça na cor <strong>Coffee</strong> e ganhe um{" "}
                <strong>drip coffee exclusivo</strong> da nossa parceira{" "}
                <strong>Fera Café</strong>. Porque quem veste bem, também merece
                um bom café. ☕
              </p>
              <div className="pt-2">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/produtos?cor=Coffee">Ver peças Coffee</Link>
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex justify-center order-1 md:order-2">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-primary/30 shadow-product">
                <img
                  src={productImage}
                  alt="Peça Vitz na cor Coffee"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-background py-16 md:py-24">
        <div className="vitz-container">
          <h2 className="vitz-heading-lg text-center mb-4">Como funciona?</h2>
          <p className="vitz-body text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Participar é simples. Siga os 3 passos abaixo e garanta seu café!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card border border-border"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="vitz-label text-muted-foreground">Passo {i + 1}</span>
                <h3 className="text-xl font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                  {step.title}
                </h3>
                <p className="vitz-body text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg" asChild>
              <Link to="/produtos?cor=Coffee">Quero participar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-muted py-8">
        <div className="vitz-container text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            *Promoção válida enquanto durarem os estoques. Limitado a 1 drip coffee por pedido
            que contenha pelo menos 1 peça na cor Coffee. O drip coffee será enviado junto
            com o pedido. Promoção em parceria com a Fera Café.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default MoreCoffeePleasePage;
