import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CarouselProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  badge: string | null;
  short_description: string | null;
  image_url: string | null;
  is_coming_soon: boolean;
}

const ProductsCarousel = () => {
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            slug,
            price,
            original_price,
            badge,
            short_description,
            is_coming_soon,
            images:product_images(url, is_primary)
          `)
          .eq("is_active", true)
          .limit(8);

        if (error) throw error;

        const formattedProducts: CarouselProduct[] = (data || []).map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          original_price: product.original_price,
          badge: product.badge,
          short_description: product.short_description,
          is_coming_soon: product.is_coming_soon,
          image_url: product.images?.find((img: { is_primary: boolean }) => img.is_primary)?.url 
            || product.images?.[0]?.url 
            || null,
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getBadgeLabel = (badge?: string | null) => {
    switch (badge) {
      case "novo":
        return "Novo";
      case "mais-vendido":
        return "Mais Vendido";
      case "promo":
        return "Promo";
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="vitz-container">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-8"></div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-1/2 md:w-1/4">
                  <div className="aspect-[3/4] bg-muted rounded-sm mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20">
      <div className="vitz-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="vitz-label text-primary">Catálogo</span>
            <h2 className="vitz-heading-lg text-foreground mt-2">Meus Produtos</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation Arrows - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 mr-4">
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Próximo"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <Button variant="minimal" asChild>
              <Link to="/produtos">Ver todos</Link>
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {products.map((product) => {
              const isComingSoon = product.is_coming_soon;
              const badgeLabel = isComingSoon ? null : getBadgeLabel(product.badge);
              
              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-1/2 md:w-1/4 pl-4"
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
                      {badgeLabel && (
                        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-sm font-medium uppercase tracking-wider">
                          {badgeLabel}
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
                        <p className="text-xs text-muted-foreground italic">Lançamento em breve</p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation Arrows */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-6">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próximo"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductsCarousel;
