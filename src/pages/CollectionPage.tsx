import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarlyAccess } from "@/hooks/useEarlyAccess";

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const earlyAccessValid = useEarlyAccess();

  const { data, isLoading } = useQuery({
    queryKey: ["collection", slug],
    queryFn: async () => {
      const { data: category } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("slug", slug || "")
        .eq("is_active", true)
        .maybeSingle();

      let query = supabase
        .from("products")
        .select("id, name, slug, price, original_price, badge, short_description, created_at, is_coming_soon, product_images(url, is_primary, display_order)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (category) query = query.eq("category_id", category.id);
      else if (slug !== "feminino" && slug !== "todos") return { category: null, products: [] };

      const { data: products, error } = await query;
      if (error) throw error;
      return { category, products: products || [] };
    },
  });

  const title = data?.category?.name || slug;
  const products = data?.products || [];

  return (
    <>
      <Helmet>
        <title>{title} | Vitz - Roupas Fitness Premium</title>
        <meta name="description" content={data?.category?.description || "Explore nossa coleção de roupas fitness premium"} />
      </Helmet>
      <Layout>
        <nav className="vitz-container py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
            <ChevronRight size={14} />
            <li className="text-foreground capitalize">{title}</li>
          </ol>
        </nav>
        <header className="vitz-container pb-12">
          <h1 className="vitz-heading-xl text-foreground capitalize">{title}</h1>
          {data?.category?.description && (
            <p className="vitz-body text-muted-foreground mt-2 max-w-xl">{data.category.description}</p>
          )}
        </header>
        <section className="vitz-container pb-20">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p, index) => {
                const imgs = [...(p.product_images || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
                const img = imgs.find((i) => i.is_primary)?.url || imgs[0]?.url || "/placeholder.svg";
                return (
                  <div key={p.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard
                      product={{
                        id: p.id, name: p.name, slug: p.slug, price: p.price,
                        originalPrice: p.original_price ?? undefined, images: [img],
                        badge: p.badge as "novo" | "mais-vendido" | "promo" | undefined,
                        description: "", shortDescription: p.short_description ?? "",
                        category: slug || "", variants: [], benefits: [], rating: 0, reviewCount: 0,
                        createdAt: p.created_at,
                        isComingSoon: earlyAccessValid ? false : (p.is_coming_soon ?? false),
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-6">Nenhum produto encontrado nesta coleção.</p>
              <Link to="/" className="text-primary underline hover:text-foreground transition-colors">Voltar para a home</Link>
            </div>
          )}
        </section>
      </Layout>
    </>
  );
};

export default CollectionPage;
