import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/product/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import ProductFilters, { ProductFiltersState } from "@/components/products/ProductFilters";
import { useEarlyAccess } from "@/hooks/useEarlyAccess";

type SortOption = "order" | "newest" | "price-asc" | "price-desc" | "name";

const ProductsPage = () => {
  const earlyAccessValid = useEarlyAccess();
  const [sortBy, setSortBy] = useState<SortOption>("order");
  const [filters, setFilters] = useState<ProductFiltersState>({
    priceRange: [0, 1000],
    colors: [],
    categories: [],
    sizes: [],
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch max price for slider
  const { data: maxPrice } = useQuery({
    queryKey: ["max-price"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("price")
        .eq("is_active", true)
        .order("price", { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0]?.price || 1000;
    },
  });

  // Update price range when maxPrice is loaded
  useEffect(() => {
    if (maxPrice && filters.priceRange[1] === 1000) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [0, Math.ceil(maxPrice / 100) * 100],
      }));
    }
  }, [maxPrice]);

  // Fetch products with images and variants for filtering
  const { data: products, isLoading } = useQuery({
    queryKey: ["all-products", filters, sortBy],
    queryFn: async () => {
      // First, get products with their variants
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          original_price,
          badge,
          short_description,
          category_id,
          created_at,
          is_coming_soon,
          product_images(url, is_primary),
          product_variants(color, size, is_active)
        `)
        .eq("is_active", true);

      // Filter by categories
      if (filters.categories.length > 0) {
        query = query.in("category_id", filters.categories);
      }

      // Filter by price range
      query = query.gte("price", filters.priceRange[0]).lte("price", filters.priceRange[1]);

      // Sort - always use display_order as secondary sort for consistency
      switch (sortBy) {
        case "order":
          query = query.order("display_order", { ascending: true });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false }).order("display_order", { ascending: true });
          break;
        case "price-asc":
          query = query.order("price", { ascending: true }).order("display_order", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false }).order("display_order", { ascending: true });
          break;
        case "name":
          query = query.order("name", { ascending: true }).order("display_order", { ascending: true });
          break;
        default:
          query = query.order("display_order", { ascending: true });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by color and size (client-side since we need to check variants)
      let filteredData = data;

      if (filters.colors.length > 0 || filters.sizes.length > 0) {
        filteredData = data?.filter((product) => {
          const activeVariants = product.product_variants?.filter((v) => v.is_active) || [];
          
          const colorMatch = filters.colors.length === 0 || 
            activeVariants.some((v) => filters.colors.includes(v.color));
          
          const sizeMatch = filters.sizes.length === 0 || 
            activeVariants.some((v) => filters.sizes.includes(v.size));
          
          return colorMatch && sizeMatch;
        });
      }
      
      // Get primary image or first available image
      return filteredData?.map((product) => {
        const primaryImage = product.product_images?.find((img) => img.is_primary);
        const firstImage = product.product_images?.[0];
        return {
          ...product,
          image_url: primaryImage?.url || firstImage?.url || "/placeholder.svg",
        };
      });
    },
  });

  const effectiveMaxPrice = maxPrice ? Math.ceil(maxPrice / 100) * 100 : 1000;

  return (
    <Layout>
      <Helmet>
        <title>Todos os Produtos | Loja</title>
        <meta name="description" content="Explore nossa coleção completa de produtos fitness e wellness." />
      </Helmet>

      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Todos os Produtos
          </h1>
          <p className="text-muted-foreground">
            Explore nossa coleção completa
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <ProductFilters
            categories={categories || []}
            filters={filters}
            onFiltersChange={setFilters}
            maxPrice={effectiveMaxPrice}
          />

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Ordem padrão</SelectItem>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>

          {products && (
            <p className="text-sm text-muted-foreground self-center ml-auto">
              {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  originalPrice: product.original_price ?? undefined,
                  images: [product.image_url],
                  badge: product.badge as 'novo' | 'mais-vendido' | 'promo' | undefined,
                  description: "",
                  shortDescription: product.short_description ?? "",
                  category: "",
                  variants: [],
                  benefits: [],
                  rating: 0,
                  reviewCount: 0,
                  createdAt: product.created_at,
                  isComingSoon: earlyAccessValid ? false : (product.is_coming_soon ?? false),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;
