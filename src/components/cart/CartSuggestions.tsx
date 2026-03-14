import { useEffect, useState, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { Product, ProductVariant } from "@/types/product";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

const ACESSORIOS_CATEGORY_ID = "1bb234a0-9b36-4534-8718-b055dcff705f";
const AUTO_ROTATE_MS = 4000;

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  variants: ProductVariant[];
  fullProduct: Product;
}

const CartSuggestions = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { items, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

          const images = (p.product_images || []).sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );
          const primaryImage = images.find((i) => i.is_primary) || images[0];

          const variants: ProductVariant[] = activeVariants.map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            colorHex: v.color_hex || "",
            stock: v.stock,
            sku: v.sku || "",
          }));

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
            variants,
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
            variants,
            fullProduct,
          };
        })
        .filter(Boolean) as SuggestionProduct[];

      setSuggestions(mapped);

      // Set default selected variant for each product
      const defaults: Record<string, string> = {};
      mapped.forEach((s) => {
        defaults[s.id] = s.variants[0].id;
      });
      setSelectedVariants(defaults);
    };

    fetchData();
  }, []);

  const cartProductIds = new Set(items.map((i) => i.product.id));
  const filtered = suggestions.filter((s) => !cartProductIds.has(s.id));

  // Auto-rotate
  useEffect(() => {
    if (filtered.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filtered.length);
    }, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [filtered.length]);

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= filtered.length) setCurrentIndex(0);
  }, [filtered.length, currentIndex]);

  const safeIndex = filtered.length > 0 ? currentIndex % filtered.length : 0;
  const current = filtered[safeIndex];

  if (!current) return null;

  const currentVariantId = selectedVariants[current.id] || current.variants[0].id;
  const currentVariant = current.variants.find((v) => v.id === currentVariantId) || current.variants[0];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const navigate = (dir: 1 | -1) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIndex((prev) => (prev + dir + filtered.length) % filtered.length);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filtered.length);
    }, AUTO_ROTATE_MS);
  };

  const hasMultipleVariants = current.variants.length > 1;
  // Group variants by attribute that varies
  const uniqueColors = [...new Set(current.variants.map((v) => v.color))];
  const uniqueSizes = [...new Set(current.variants.map((v) => v.size))];
  const variesByColor = uniqueColors.length > 1;
  const variesBySize = uniqueSizes.length > 1;

  return (
    <div className="px-4 py-3 border-t border-border">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between w-full mb-2"
      >
        <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
          ✨ Combina com seu look
        </h4>
        <div className="flex items-center gap-2">
          {!collapsed && filtered.length > 1 && (
            <div className="flex items-center gap-1">
              {filtered.map((_, i) => (
                <span
                  key={i}
                  className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                    i === safeIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
          )}
          {collapsed ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {!collapsed && (
        <div className="flex items-center gap-3">
          {/* Image */}
          <Link to={`/produto/${current.slug}`} className="w-16 h-16 flex-shrink-0 rounded-sm bg-muted overflow-hidden">
            <img
              src={getOptimizedImageUrl(current.image, 128, 128)}
              alt={current.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link to={`/produto/${current.slug}`} className="text-sm font-medium leading-tight truncate block hover:underline">{current.name}</Link>
            <p className="text-xs text-muted-foreground">{formatPrice(current.price)}</p>

            {/* Variant selector */}
            {hasMultipleVariants && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {variesByColor &&
                  current.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() =>
                        setSelectedVariants((prev) => ({ ...prev, [current.id]: v.id }))
                      }
                      title={`${v.color}${variesBySize ? ` / ${v.size}` : ""}`}
                      className={`w-5 h-5 rounded-full border-2 transition-colors ${
                        v.id === currentVariantId
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      style={{ backgroundColor: v.colorHex || undefined }}
                    />
                  ))}
                {!variesByColor &&
                  variesBySize &&
                  current.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() =>
                        setSelectedVariants((prev) => ({ ...prev, [current.id]: v.id }))
                      }
                      className={`text-[10px] px-1.5 py-0.5 rounded-sm border transition-colors ${
                        v.id === currentVariantId
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Navigation + Add */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={() => addToCart(current.fullProduct, currentVariant, 1, current.image)}
              className="flex items-center justify-center w-8 h-8 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
            </button>
            {filtered.length > 1 && (
              <div className="flex gap-0.5">
                <button
                  onClick={() => navigate(-1)}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSuggestions;
