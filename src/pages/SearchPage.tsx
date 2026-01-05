import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_name: string | null;
  short_description: string | null;
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchProducts = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          original_price,
          short_description,
          category:categories(name),
          images:product_images(url, is_primary)
        `)
        .eq("is_active", true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`)
        .order("name");

      if (error) throw error;

      const formattedResults: SearchProduct[] = (data || []).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        original_price: product.original_price,
        short_description: product.short_description,
        image_url: product.images?.find((img: { is_primary: boolean }) => img.is_primary)?.url 
          || product.images?.[0]?.url 
          || null,
        category_name: product.category?.name || null,
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Search on mount if there's a query param
  useEffect(() => {
    if (initialQuery) {
      searchProducts(initialQuery);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    searchProducts(query);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Layout>
      <Helmet>
        <title>{initialQuery ? `Busca: ${initialQuery}` : "Buscar"} | VITZ</title>
        <meta name="description" content="Busque produtos na VITZ" />
      </Helmet>

      <div className="vitz-container py-8 md:py-12">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12">
          <h1 className="font-heading text-2xl md:text-3xl text-center mb-6">
            {initialQuery ? `Resultados para "${initialQuery}"` : "Buscar Produtos"}
          </h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome, descrição..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" className="h-12 px-6">
              Buscar
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* No Results */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Nenhum produto encontrado</h2>
            <p className="text-muted-foreground">
              Tente buscar por outros termos ou explore nossas coleções.
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && results.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {results.length} {results.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map((product) => (
                <Link
                  key={product.id}
                  to={`/produto/${product.slug}`}
                  className="group"
                >
                  <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {product.category_name && (
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {product.category_name}
                      </p>
                    )}
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.short_description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatPrice(product.price)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Initial State */}
        {!isLoading && !hasSearched && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Digite algo para buscar produtos
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
