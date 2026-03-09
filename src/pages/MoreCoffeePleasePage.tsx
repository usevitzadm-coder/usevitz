import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Coffee, Gift, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import coffeeBg from "@/assets/coffee-beans-bg.jpg";
import logoFeraCafe from "@/assets/logo-fera-cafe-white.png";

const steps = [
{
  icon: ShoppingBag,
  title: "Escolha sua peça",
  description: "Navegue pela coleção e escolha qualquer peça na cor Coffee."
},
{
  icon: Coffee,
  title: "Finalize sua compra",
  description: "Adicione ao carrinho e finalize normalmente."
},
{
  icon: Gift,
  title: "Ganhe seu drip coffee",
  description: "Receba um drip coffee exclusivo da Fera Café junto com seu pedido!"
}];


interface CoffeeProduct {
  url: string;
  productName: string;
  productSlug: string;
}

const MoreCoffeePleasePage = () => {
  // Fetch coffee color id
  const { data: coffeeColor } = useQuery({
    queryKey: ["coffee-color"],
    queryFn: async () => {
      const { data } = await supabase.
      from("colors").
      select("id").
      ilike("name", "coffee").
      eq("is_active", true).
      maybeSingle();
      return data;
    }
  });

  // Fetch coffee product images with product info
  const { data: coffeeProducts = [] } = useQuery({
    queryKey: ["coffee-products", coffeeColor?.id],
    enabled: !!coffeeColor?.id,
    queryFn: async () => {
      // Get images explicitly linked to coffee color
      const { data: linkedImages } = await supabase.
      from("product_images").
      select("url, product_id, products!inner(name, slug, is_active)").
      eq("color_id", coffeeColor!.id).
      eq("products.is_active", true);

      // Get products with coffee variants
      const { data: coffeeVariants } = await supabase.
      from("product_variants").
      select("product_id").
      ilike("color", "coffee").
      eq("is_active", true);

      const coffeeProductIds = [...new Set(coffeeVariants?.map((v) => v.product_id) || [])];
      const linkedProductIds = linkedImages?.map((i) => i.product_id) || [];
      const missingProductIds = coffeeProductIds.filter((id) => !linkedProductIds.includes(id));

      const results: CoffeeProduct[] = (linkedImages || []).map((i) => ({
        url: i.url,
        productName: (i.products as any).name,
        productSlug: (i.products as any).slug
      }));

      if (missingProductIds.length > 0) {
        const { data: fallback } = await supabase.
        from("product_images").
        select("url, product_id, products!inner(name, slug)").
        in("product_id", missingProductIds).
        eq("is_primary", true);

        if (fallback) {
          results.push(
            ...fallback.map((i) => ({
              url: i.url,
              productName: (i.products as any).name,
              productSlug: (i.products as any).slug
            }))
          );
        }
      }

      return results;
    }
  });

  return (
    <Layout>
      <Helmet>
        <title>More Coffee, Please! | Vitz</title>
        <meta
          name="description"
          content="Promoção More Coffee, Please! Compre qualquer peça na cor Coffee e ganhe um drip coffee exclusivo da Fera Café." />
        
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={coffeeBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high" />
        
        <div className="absolute inset-0 bg-[#3b1f04]/75" />

        <div className="vitz-container relative z-10 py-20 md:py-32">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span
              className="inline-block text-xs uppercase tracking-[0.25em] font-medium px-4 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(191, 162, 117, 0.2)",
                color: "#e8d5b5",
                border: "1px solid rgba(191, 162, 117, 0.3)"
              }}>
              
              ☕ Promoção Especial
            </span>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light italic tracking-tight"
              style={{
                fontFamily: "var(--font-heading)",
                color: "#f5ead6",
                textShadow: "0 2px 20px rgba(0,0,0,0.3)"
              }}>
              
              More Coffee,
              <br />
              <span style={{ color: "#bfa275" }}>please!</span>
            </h1>
            <p
              className="text-base md:text-lg font-light leading-relaxed max-w-lg mx-auto"
              style={{ fontFamily: "var(--font-body)", color: "#d4c4a8" }}>
              
              Compre qualquer peça na cor <strong style={{ color: "#e8d5b5" }}>Coffee</strong> e
              ganhe um <strong style={{ color: "#e8d5b5" }}>drip coffee exclusivo</strong> da
              nossa parceira <strong style={{ color: "#e8d5b5" }}>Fera Café</strong>.
            </p>
            <div className="flex items-center justify-center gap-3">
              <p
                className="italic"
                style={{ fontFamily: "var(--font-heading)", color: "#bfa275", fontSize: "1.1rem" }}>
                
                Porque quem veste bem, também merece um bom café.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-xs uppercase tracking-[0.15em]" style={{ color: "#a0693a" }}>
                Em parceria com
              </span>
              <img
                src={logoFeraCafe}
                alt="Fera Café"
                className="h-12 w-auto object-contain" />
              
            </div>
            <div className="pt-4">
              <Button
                size="lg"
                className="h-14 px-10 text-base uppercase tracking-[0.15em] font-medium"
                style={{ backgroundColor: "#bfa275", color: "#3b1f04" }}
                asChild>
                
                <Link to="/produtos?cor=Coffee">Ver peças Coffee</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ backgroundColor: "#f5ead6" }} className="py-16 md:py-24">
        <div className="vitz-container">
          <h2 className="vitz-heading-lg text-center mb-4" style={{ color: "#3b1f04" }}>
            Como funciona?
          </h2>
          <p className="vitz-body text-center mb-12 max-w-lg mx-auto" style={{ color: "#7a4a1e" }}>
            Participar é simples. Siga os 3 passos abaixo e garanta seu café!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) =>
            <div
              key={i}
              className="flex flex-col items-center text-center space-y-4 p-8 rounded-2xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(191, 162, 117, 0.3)",
                backdropFilter: "blur(10px)"
              }}>
              
                <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(91, 47, 6, 0.1)" }}>
                
                  <step.icon className="w-7 h-7" style={{ color: "#5B2F06" }} />
                </div>
                <span
                className="text-xs uppercase tracking-[0.2em] font-medium"
                style={{ color: "#a0693a", fontFamily: "var(--font-body)" }}>
                
                  Passo {i + 1}
                </span>
                <h3
                className="text-xl font-medium"
                style={{ fontFamily: "var(--font-heading)", color: "#3b1f04" }}>
                
                  {step.title}
                </h3>
                <p
                className="text-sm font-light leading-relaxed"
                style={{ color: "#7a4a1e", fontFamily: "var(--font-body)" }}>
                
                  {step.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Coffee Products Gallery */}
      {coffeeProducts.length > 0 &&
      <section style={{ backgroundColor: "#3b1f04" }} className="py-16 md:py-24">
          <div className="vitz-container">
            <h2
            className="vitz-heading-lg text-center mb-4"
            style={{ color: "#f5ead6" }}>
            
              Peças na cor Coffee
            </h2>
            <p
            className="vitz-body text-center mb-12 max-w-lg mx-auto"
            style={{ color: "#a0693a" }}>
            
              Qualquer uma dessas peças garante seu drip coffee da Fera Café.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {coffeeProducts.map((product, i) =>
            <Link
              key={i}
              to={`/produto/${product.productSlug}`}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(191, 162, 117, 0.2)" }}>
              
                  <img
                src={product.url}
                alt={product.productName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              
                  <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
                style={{
                  background:
                  "linear-gradient(to top, rgba(59, 31, 4, 0.85) 0%, transparent 50%)"
                }}>
                
                    <span
                  className="p-4 text-sm font-medium"
                  style={{ color: "#f5ead6", fontFamily: "var(--font-body)" }}>
                  
                      {product.productName}
                    </span>
                  </div>
                </Link>
            )}
            </div>

            <div className="text-center mt-12">
              <Button
              size="lg"
              className="h-14 px-10 text-base uppercase tracking-[0.15em] font-medium"
              style={{ backgroundColor: "#bfa275", color: "#3b1f04" }}
              asChild>
              
                <Link to="/produtos?cor=Coffee">Quero participar ☕</Link>
              </Button>
            </div>
          </div>
        </section>
      }

      {/* Disclaimer */}
      <section
        style={{ backgroundColor: "#3b1f04" }}
        className="py-8">
        
        <div className="vitz-container text-center">
          <p className="text-xs max-w-2xl mx-auto text-primary-foreground" style={{ color: "#a0693a" }}>
            *Promoção válida enquanto durarem os estoques. Limitado a 1 drip coffee por pedido
            que contenha pelo menos 1 peça na cor Coffee. O drip coffee será enviado junto
            com o pedido. Promoção em parceria com a Fera Café.
          </p>
        </div>
      </section>
    </Layout>);

};

export default MoreCoffeePleasePage;