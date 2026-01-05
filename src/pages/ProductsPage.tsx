import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/product/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";

type SortOption = "newest" | "price-asc" | "price-desc" | "name";

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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

  // Fetch products with images
  const { data: products, isLoading } = useQuery({
    queryKey: ["all-products", selectedCategory, sortBy],
    queryFn: async () => {
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
          product_images!inner(url, is_primary)
        `)
        .eq("is_active", true)
        .eq("product_images.is_primary", true);

      // Filter by category
      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      // Sort
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "name":
          query = query.order("name", { ascending: true });
          break;
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data?.map(product => ({
        ...product,
        image_url: product.product_images[0]?.url || "/placeholder.svg"
      }));
    },
  });

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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
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
