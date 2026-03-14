import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Star, Minus, Plus, ChevronRight, Truck, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import SimilarProducts from "@/components/product/SimilarProducts";
import ProductGallery from "@/components/product/ProductGallery";
import LaunchLeadForm from "@/components/product/LaunchLeadForm";
import CoffeePromoToast from "@/components/product/CoffeePromoToast";
import { useToast } from "@/hooks/use-toast";
import { useEarlyAccess } from "@/hooks/useEarlyAccess";

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const earlyAccessValid = useEarlyAccess();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState<number | undefined>(undefined);
  const [showCoffeePromo, setShowCoffeePromo] = useState(false);

  // Fetch product from database
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          original_price,
          badge,
          description,
          short_description,
          benefits,
          size_guide,
          rating,
          review_count,
          category_id,
          is_coming_soon,
          categories(name, slug),
          product_images(id, url, is_primary, display_order),
          product_variants(id, size, color, color_hex, stock, is_active)
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      // Fetch color_id for images separately (type not yet in generated types)
      if (data?.product_images?.length) {
        const imageIds = data.product_images.map((img: any) => img.id);
        const { data: imageColors } = await supabase
          .from("product_images")
          .select("id, color_id" as any)
          .in("id", imageIds);
        
        if (imageColors) {
          const colorMap = Object.fromEntries(imageColors.map((ic: any) => [ic.id, ic.color_id]));
          data.product_images = data.product_images.map((img: any) => ({
            ...img,
            color_id: colorMap[img.id] || null,
          }));
        }
      }
      
      return data;
    },
    enabled: !!slug,
  });

  // Fetch colors from admin
  const { data: adminColors } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("id, name, hex_code")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
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
          created_at,
          product_images(url, is_primary)
        `)
        .eq("is_active", true)
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4);

      if (error) throw error;

      return data?.map((p) => {
        const primaryImage = p.product_images?.find((img) => img.is_primary);
        const firstImage = p.product_images?.[0];
        return {
          ...p,
          image_url: primaryImage?.url || firstImage?.url || "/placeholder.svg",
        };
      });
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="vitz-container py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            <Skeleton className="aspect-[3/4] w-full rounded-sm" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="vitz-container py-20 text-center">
          <h1 className="vitz-heading-lg mb-4">Produto não encontrado</h1>
          <Button variant="hero" asChild>
            <Link to="/produtos">Ver todos os produtos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isComingSoon = (product.is_coming_soon ?? false) && !earlyAccessValid;

  // Sort images by display_order
  const sortedImages = [...(product.product_images || [])].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  );

  // Get active variants only
  const activeVariants = product.product_variants?.filter((v) => v.is_active) || [];

  const sizeOrder = ["PP", "P", "M", "G", "GG", "XG", "XXG", "Tam. Único"];
  const sizes = [...new Set(activeVariants.map((v) => v.size))].sort((a, b) => {
    const idxA = sizeOrder.indexOf(a);
    const idxB = sizeOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  const colors = [...new Set(activeVariants.map((v) => v.color))];
  
  // Use admin colors for accurate hex values
  const adminColorMap = Object.fromEntries(
    (adminColors || []).map((c) => [c.name.toLowerCase(), c.hex_code])
  );
  const adminColorIdMap = Object.fromEntries(
    (adminColors || []).map((c) => [c.name.toLowerCase(), c.id])
  );
  const colorHexMap = Object.fromEntries(
    colors.map((color) => [color, adminColorMap[color.toLowerCase()] || "#cccccc"])
  );

  const selectedVariant = activeVariants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast({
        title: "Selecione as opções",
        description: "Por favor, escolha o tamanho e a cor.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVariant || isOutOfStock) {
      toast({
        title: "Produto indisponível",
        description: "Esta variação está esgotada.",
        variant: "destructive",
      });
      return;
    }

    // Create a product object compatible with the cart context
    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.original_price ?? undefined,
      images: sortedImages.map((img) => img.url),
      badge: product.badge as 'novo' | 'mais-vendido' | 'promo' | undefined,
      description: product.description || "",
      shortDescription: product.short_description || "",
      category: product.categories?.slug || "",
      variants: activeVariants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex || "#cccccc",
        stock: v.stock,
        sku: "",
      })),
      benefits: product.benefits || [],
      rating: product.rating || 0,
      reviewCount: product.review_count || 0,
      createdAt: new Date().toISOString(),
    };

    const cartVariant = {
      id: selectedVariant.id,
      size: selectedVariant.size,
      color: selectedVariant.color,
      colorHex: selectedVariant.color_hex || "#cccccc",
      stock: selectedVariant.stock,
      sku: "",
    };

    // Find image linked to the selected color
    const selectedColorId = adminColorIdMap[selectedColor.toLowerCase()];
    const colorSpecificImage = selectedColorId
      ? sortedImages.find((img: any) => img.color_id === selectedColorId)?.url
      : undefined;

    addToCart(cartProduct, cartVariant, quantity, colorSpecificImage || sortedImages[0]?.url);

    if (selectedColor.toLowerCase() === "coffee") {
      setShowCoffeePromo(true);
    } else {
      toast({
        title: "Produto adicionado!",
        description: `${product.name} foi adicionado ao carrinho.`,
      });
    }
  };

  const categoryName = product.categories?.name || "Produtos";
  const categorySlug = product.categories?.slug || "";

  return (
    <>
      <Helmet>
        <title>{product.name} | Vitz - Roupas Fitness Premium</title>
        <meta name="description" content={product.short_description || product.name} />
      </Helmet>
      <Layout>
        {/* Breadcrumb */}
        <nav className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight size={14} />
            {categorySlug && (
              <>
                <li>
                  <Link
                    to={`/colecao/${categorySlug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {categoryName}
                  </Link>
                </li>
                <ChevronRight size={14} />
              </>
            )}
            <li className="text-foreground">{product.name}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <section className="pb-12 lg:pb-20 overflow-hidden w-full max-w-[100vw]">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-16 w-full min-w-0">
            {/* Gallery */}
            <div className={`min-w-0 overflow-hidden ${isComingSoon ? "relative" : ""}`}>
              <ProductGallery
                images={sortedImages}
                productName={product.name}
                autoPlayInterval={3000}
                activeIndex={galleryIndex}
              />
              {isComingSoon && (
                <div className="absolute inset-0 backdrop-blur-xl bg-background/20 rounded-sm pointer-events-none" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-5 lg:space-y-6 min-w-0 overflow-hidden">
              {product.badge && (
                <span className="inline-block bg-primary text-primary-foreground text-xs px-3 py-1 rounded-sm font-medium uppercase tracking-wider">
                  {product.badge === "novo"
                    ? "Novo"
                    : product.badge === "mais-vendido"
                    ? "Mais Vendido"
                    : "Promo"}
                </span>
              )}

              <h1 className="vitz-heading-lg text-foreground">{product.name}</h1>

              {/* Rating */}
              {(product.rating || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < Math.round(product.rating || 0)
                            ? "fill-primary text-primary"
                            : "text-muted"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.review_count || 0} avaliações)
                  </span>
                </div>
              )}

              {/* Price */}
              {!isComingSoon && (
                <div className="flex items-baseline gap-3">
                  <span className="font-heading text-3xl text-foreground">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
              )}

              {product.short_description && (
                <p className="vitz-body text-muted-foreground">
                  {product.short_description}
                </p>
              )}

              {/* Color Selection */}
              {!isComingSoon && colors.length > 0 && (
                <div>
                  <h3 className="vitz-label mb-3">
                    Cor: {selectedColor && <span className="font-normal text-foreground ml-2 normal-case tracking-normal">{selectedColor}</span>}
                  </h3>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                         key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          // Find first image linked to this color
                          const colorId = adminColorIdMap[color.toLowerCase()];
                          if (colorId) {
                            const idx = sortedImages.findIndex((img: any) => img.color_id === colorId);
                            if (idx !== -1) setGalleryIndex(idx);
                          }
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? "border-foreground scale-110"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        style={{ backgroundColor: colorHexMap[color] }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {!isComingSoon && sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="vitz-label">Tamanho</h3>
                    <button className="text-xs text-muted-foreground hover:text-foreground underline">
                      Guia de tamanhos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-12 px-4 border rounded-sm text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {product.size_guide && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {product.size_guide}
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              {!isComingSoon && (
                <div>
                  <h3 className="vitz-label mb-3">Quantidade</h3>
                  <div className="flex items-center">
                    <div className="flex items-center border border-border rounded">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-muted transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={!selectedVariant || quantity >= selectedVariant.stock}
                        className="p-3 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart or Lead Capture */}
              <div className="pt-4">
                {isComingSoon ? (
                  <LaunchLeadForm productId={product.id} productName={product.name} />
                ) : (
                  <Button
                    variant="hero"
                    className="w-full h-11 text-xs sm:text-sm tracking-wider"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || activeVariants.length === 0}
                  >
                    {activeVariants.length === 0
                      ? "Sem estoque"
                      : isOutOfStock
                      ? "Esgotado"
                      : "Adicionar ao Carrinho"}
                  </Button>
                )}
              </div>

              {/* Benefits */}
              {!isComingSoon && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck size={18} className="shrink-0" />
                    <span>Frete grátis acima de R$ 239,90</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw size={18} className="shrink-0" />
                    <span>Troca grátis</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="pt-6 border-t border-border">
                  <h3 className="vitz-label mb-4">Descrição</h3>
                  <p className="vitz-body text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Benefits List */}
              {product.benefits && product.benefits.length > 0 && (
                <div className="pt-6 border-t border-border">
                  <h3 className="vitz-label mb-4">Benefícios</h3>
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="py-16 bg-vitz-cream-dark">
            <div className="vitz-container">
              <h2 className="vitz-heading-md text-foreground mb-8">
                Você também pode gostar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      price: p.price,
                      originalPrice: p.original_price ?? undefined,
                      images: [p.image_url],
                      badge: p.badge as 'novo' | 'mais-vendido' | 'promo' | undefined,
                      description: "",
                      shortDescription: p.short_description ?? "",
                      category: "",
                      variants: [],
                      benefits: [],
                      rating: 0,
                      reviewCount: 0,
                      createdAt: p.created_at,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </Layout>
      <CoffeePromoToast
        visible={showCoffeePromo}
        onClose={() => setShowCoffeePromo(false)}
      />
    </>
  );
};

export default ProductPage;