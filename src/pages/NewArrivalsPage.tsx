import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useEarlyAccess } from "@/hooks/useEarlyAccess";

interface NewProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  badge: string | null;
  short_description: string | null;
  is_coming_soon: boolean;
  image_url: string | null;
}

const NewArrivalsPage = () => {
  const [products, setProducts] = useState<NewProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const earlyAccess = useEarlyAccess();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, slug, price, original_price, badge,
            short_description, is_coming_soon,
            images:product_images(url, is_primary)
          `)
          .eq("is_active", true)
          .eq("is_coming_soon", true);

        if (error) throw error;

        const formatted: NewProduct[] = (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          original_price: p.original_price,
          badge: p.badge,
          short_description: p.short_description,
          is_coming_soon: p.is_coming_soon,
          image_url:
            p.images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
            p.images?.[0]?.url ||
            null,
        }));

        setProducts(formatted);
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <>
      <Helmet>
        <title>Novidades | Vitz - Nova Coleção Essential & Daily</title>
        <meta
          name="description"
          content="Conheça a nova coleção Vitz com as cores Sand e Aloe. Peças com alta compressão, conforto e estilo para o seu treino."
        />
      </Helmet>
      <Layout>
        {/* Breadcrumb */}
        <nav className="vitz-container py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            </li>
            <ChevronRight size={14} />
            <li className="text-foreground">Novidades</li>
          </ol>
        </nav>

        {/* Collection Story */}
        <header className="vitz-container pb-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary" />
              <span className="vitz-label text-primary">Nova Coleção</span>
            </div>
            <h1 className="vitz-heading-xl text-foreground mb-5">
              Essential & Daily
            </h1>
            <p className="vitz-body text-muted-foreground leading-relaxed mb-4">
              Apresentamos duas cores que traduzem a essência da nova estação:{" "}
              <strong className="text-foreground">Sand</strong>, um tom terroso e
              sofisticado que remete à natureza e à calma, e{" "}
              <strong className="text-foreground">Aloe</strong>, um verde suave e
              refrescante inspirado na vitalidade das plantas. Juntas, elas compõem
              uma paleta que equilibra serenidade e energia — perfeita para quem
              treina com intenção.
            </p>
            <p className="vitz-body text-muted-foreground leading-relaxed">
              As linhas Essential e Daily chegam com modelagens repensadas, tecidos
              de alta compressão e acabamentos que acompanham cada movimento. Peças
              pensadas para ir do treino à vida, sem abrir mão de conforto e estilo.
            </p>
          </div>
        </header>

        {/* Products Grid */}
        <section className="vitz-container pb-20">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-sm mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => {
                const isComingSoon = earlyAccess ? false : product.is_coming_soon;

                return (
                  <div
                    key={product.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Link to={`/produto/${product.slug}`} className="group block">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted mb-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                              isComingSoon ? "blur-lg scale-110" : ""
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            Sem imagem
                          </div>
                        )}
                        {isComingSoon && (
                          <span className="absolute top-3 left-3 bg-foreground text-background text-xs px-3 py-1 rounded-sm font-medium uppercase tracking-wider">
                            Em Breve
                          </span>
                        )}
                        {!isComingSoon && product.badge === "novo" && (
                          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-sm font-medium uppercase tracking-wider">
                            Novo
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        {!isComingSoon && (
                          <>
                            {product.short_description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {product.short_description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <span className="font-medium text-foreground">
                                {formatPrice(product.price)}
                              </span>
                              {product.original_price && product.original_price > product.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(product.original_price)}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                        {isComingSoon && (
                          <p className="text-xs text-muted-foreground italic">
                            Lançamento em breve
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-6">
                Nenhuma novidade no momento. Volte em breve!
              </p>
              <Link
                to="/"
                className="text-primary underline hover:text-foreground transition-colors"
              >
                Voltar para a home
              </Link>
            </div>
          )}
        </section>
      </Layout>
    </>
  );
};

export default NewArrivalsPage;
