import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { Product, ProductVariant } from "@/types/product";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

const ACESSORIOS_CATEGORY_ID = "1bb234a0-9b36-4534-8718-b055dcff705f";

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  variant: ProductVariant;
  fullProduct: Product;
}

const CartSuggestions = () => {
  const { items, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, original_price, description, short_description, badge, benefits, rating, review_count, is_coming_soon, category_id, product_images(url, display_order, is_primary), product_variants(id, size, color, color_hex, stock, sku, is_active)"
        )
        .eq("category_id", ACESSORIOS_CATEGORY_ID)
        .eq("is_active", true);

      if (!data) return;

      const mapped: SuggestionProduct[] = data
        .map((p) => {
          const activeVariants = (p.product_variants || []).filter(
            (v) => v.is_active && v.stock > 0
          );
          if (activeVariants.length === 0) return null;

          const images = (p.product_images || [])
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          const primaryImage = images.find((i) => i.is_primary) || images[0];

          const variant: ProductVariant = {
            id: activeVariants[0].id,
            size: activeVariants[0].size,
            color: activeVariants[0].color,
            colorHex: activeVariants[0].color_hex || "",
            stock: activeVariants[0].stock,
            sku: activeVariants[0].sku || "",
          };

          const fullProduct: Product = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            originalPrice: p.original_price ?? undefined,
            description: p.description || "",
            shortDescription: p.short_description || "",
            images: images.map((i) => i.url),
            category: "acessorios",
            variants: activeVariants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              colorHex: v.color_hex || "",
              stock: v.stock,
              sku: v.sku || "",
            })),
            benefits: (p.benefits as string[]) || [],
            badge: p.badge as Product["badge"],
            rating: p.rating || 0,
            reviewCount: p.review_count || 0,
            createdAt: "",
            isComingSoon: p.is_coming_soon,
          };

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            image: primaryImage?.url || "",
            variant,
            fullProduct,
          };
        })
        .filter(Boolean) as SuggestionProduct[];

      setSuggestions(mapped);
    };

    fetch();
  }, []);

  const cartProductIds = new Set(items.map((i) => i.product.id));
  const filtered = suggestions.filter((s) => !cartProductIds.has(s.id));

  if (filtered.length === 0) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div className="px-4 py-4 border-t border-border">
      <h4 className="font-heading text-sm font-medium mb-3">Leve também</h4>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="snap-start flex-shrink-0 w-[130px] flex flex-col"
          >
            <div className="relative aspect-square rounded-sm bg-muted overflow-hidden mb-2">
              <img
                src={getOptimizedImageUrl(s.image, 160, 160)}
                alt={s.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-medium leading-tight line-clamp-2 mb-1">
              {s.name}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {formatPrice(s.price)}
            </p>
            <button
              onClick={() => addToCart(s.fullProduct, s.variant, 1, s.image)}
              className="mt-auto flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartSuggestions;
