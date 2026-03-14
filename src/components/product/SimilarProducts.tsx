import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/product/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarProductsProps {
  categoryId: string;
  currentProductId: string;
}

const SimilarProducts = ({ categoryId, currentProductId }: SimilarProductsProps) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["similar-products", categoryId, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, slug, price, original_price, badge,
          short_description, created_at, is_coming_soon,
          product_images(url, is_primary)
        `)
        .eq("is_active", true)
        .eq("category_id", categoryId)
        .neq("id", currentProductId)
        .limit(8);

      if (error) throw error;

      return data?.map((p) => {
        const primaryImage = p.product_images?.find((img) => img.is_primary);
        const firstImage = p.product_images?.[0];
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          originalPrice: p.original_price ?? undefined,
          images: [primaryImage?.url || firstImage?.url || "/placeholder.svg"],
          badge: p.badge as "novo" | "mais-vendido" | "promo" | undefined,
          description: "",
          shortDescription: p.short_description ?? "",
          category: "",
          variants: [],
          benefits: [],
          rating: 0,
          reviewCount: 0,
          createdAt: p.created_at,
          isComingSoon: p.is_coming_soon,
        };
      });
    },
    enabled: !!categoryId,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-vitz-cream-dark">
        <div className="vitz-container">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-sm" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 bg-vitz-cream-dark">
      <div className="vitz-container">
        <h2 className="vitz-heading-md text-foreground mb-8">
          ✨ Complete seu look
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: 1,
          }}
          plugins={[
            Autoplay({ delay: 4000, stopOnInteraction: true }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-3 md:pl-4 basis-[65%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
};

export default SimilarProducts;
