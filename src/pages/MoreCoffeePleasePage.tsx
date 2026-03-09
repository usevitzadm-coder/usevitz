import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Coffee, Gift, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import coffeeBg from "@/assets/coffee-beans-bg.jpg";

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
  const [currentImage, setCurrentImage] = useState(0);

  // Fetch coffee color id
  const { data: coffeeColor } = useQuery({
    queryKey: ["coffee-color"],
    queryFn: async () => {
      const { data } = await supabase
        .from("colors")
        .select("id")
        .ilike("name", "coffee")
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

  // Fetch images linked to coffee color
  const { data: coffeeImages = [] } = useQuery({
    queryKey: ["coffee-images", coffeeColor?.id],
    enabled: !!coffeeColor?.id,
    queryFn: async () => {
      // Get images explicitly linked to coffee color
      const { data: linkedImages } = await supabase
        .from("product_images")
        .select("url, product_id, products!inner(name, is_active)")
        .eq("color_id", coffeeColor!.id)
        .eq("products.is_active", true);

      // Get primary images from products that have coffee variants but no color-linked images
      const { data: coffeeProducts } = await supabase
        .from("product_variants")
        .select("product_id")
        .ilike("color", "coffee")
        .eq("is_active", true);

      const coffeeProductIds = [...new Set(coffeeProducts?.map((v) => v.product_id) || [])];
      const linkedProductIds = linkedImages?.map((i) => i.product_id) || [];
      const missingProductIds = coffeeProductIds.filter((id) => !linkedProductIds.includes(id));

      let fallbackImages: { url: string }[] = [];
      if (missingProductIds.length > 0) {
        const { data } = await supabase
          .from("product_images")
          .select("url")
          .in("product_id", missingProductIds)
          .eq("is_primary", true);
        fallbackImages = data || [];
      }

      const allUrls = [
        ...(linkedImages?.map((i) => i.url) || []),
        ...fallbackImages.map((i) => i.url),
      ];
      return allUrls;
    },
  });

  // Auto-rotate images
  useEffect(() => {
    if (coffeeImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % coffeeImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [coffeeImages.length]);

  return (
    <Layout>
      <Helmet>
        <title>More Coffee, Please! | Vitz</title>
        <meta
          name="description"
          content="Promoção More Coffee, Please! Compre qualquer peça na cor Coffee e ganhe um drip coffee exclusivo da Fera Café."
        />
      </Helmet>

      {/* Hero - deep coffee tones */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <img
          src={coffeeBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#3b1f04]/75" />

        <div className="vitz-container relative z-10 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Text */}
            <div className="flex-1 text-center md:text-left space-y-6 order-2 md:order-1">
              <span
                className="inline-block text-xs uppercase tracking-[0.25em] font-medium px-4 py-1.5 rounded-full"
                style={{
                  backgroundColor: "rgba(191, 162, 117, 0.2)",
                  color: "#e8d5b5",
                  border: "1px solid rgba(191, 162, 117, 0.3)",
                }}
              >
                ☕ Promoção Especial
              </span>
              <h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light italic tracking-tight"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "#f5ead6",
                  textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                }}
              >
                More Coffee,
                <br />
                <span style={{ color: "#bfa275" }}>please!</span>
              </h1>
              <p
                className="text-base md:text-lg font-light leading-relaxed max-w-md mx-auto md:mx-0"
                style={{ fontFamily: "var(--font-body)", color: "#d4c4a8" }}
              >
                Compre qualquer peça na cor <strong style={{ color: "#e8d5b5" }}>Coffee</strong> e
                ganhe um <strong style={{ color: "#e8d5b5" }}>drip coffee exclusivo</strong> da
                nossa parceira <strong style={{ color: "#e8d5b5" }}>Fera Café</strong>.
              </p>
              <p
                className="text-sm italic"
                style={{ fontFamily: "var(--font-heading)", color: "#bfa275", fontSize: "1.1rem" }}
              >
                Porque quem veste bem, também merece um bom café.
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base uppercase tracking-[0.15em] font-medium"
                  style={{
                    backgroundColor: "#bfa275",
                    color: "#3b1f04",
                    border: "none",
                  }}
                  asChild
                >
                  <Link to="/produtos?cor=Coffee">Ver peças Coffee</Link>
                </Button>
              </div>
            </div>

            {/* Rotating Circle Image */}
            <div className="flex-1 flex justify-center order-1 md:order-2">
              <div
                className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[26rem] md:h-[26rem] rounded-full overflow-hidden"
                style={{
                  border: "6px solid rgba(191, 162, 117, 0.4)",
                  boxShadow:
                    "0 0 60px rgba(191, 162, 117, 0.2), inset 0 0 30px rgba(0,0,0,0.2)",
                }}
              >
                {coffeeImages.length > 0 ? (
                  coffeeImages.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`Peça Vitz cor Coffee ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                      style={{ opacity: i === currentImage ? 1 : 0 }}
                    />
                  ))
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: "#5B2F06" }}
                  >
                    <Coffee className="w-16 h-16" style={{ color: "#bfa275" }} />
                  </div>
                )}

                {/* Dots indicator */}
                {coffeeImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {coffeeImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i === currentImage ? "#bfa275" : "rgba(255,255,255,0.4)",
                          transform: i === currentImage ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona - warm coffee section */}
      <section style={{ backgroundColor: "#f5ead6" }} className="py-16 md:py-24">
        <div className="vitz-container">
          <h2
            className="vitz-heading-lg text-center mb-4"
            style={{ color: "#3b1f04" }}
          >
            Como funciona?
          </h2>
          <p
            className="vitz-body text-center mb-12 max-w-lg mx-auto"
            style={{ color: "#7a4a1e" }}
          >
            Participar é simples. Siga os 3 passos abaixo e garanta seu café!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-2xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(191, 162, 117, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(91, 47, 6, 0.1)" }}
                >
                  <step.icon className="w-7 h-7" style={{ color: "#5B2F06" }} />
                </div>
                <span
                  className="text-xs uppercase tracking-[0.2em] font-medium"
                  style={{ color: "#a0693a", fontFamily: "var(--font-body)" }}
                >
                  Passo {i + 1}
                </span>
                <h3
                  className="text-xl font-medium"
                  style={{ fontFamily: "var(--font-heading)", color: "#3b1f04" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{ color: "#7a4a1e", fontFamily: "var(--font-body)" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="h-14 px-10 text-base uppercase tracking-[0.15em] font-medium"
              style={{
                backgroundColor: "#5B2F06",
                color: "#f5ead6",
                border: "none",
              }}
              asChild
            >
              <Link to="/produtos?cor=Coffee">Quero participar ☕</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section style={{ backgroundColor: "#3b1f04" }} className="py-8">
        <div className="vitz-container text-center">
          <p className="text-xs max-w-2xl mx-auto" style={{ color: "#a0693a" }}>
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
