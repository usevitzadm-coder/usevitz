import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  category_name: string | null;
}

interface SearchBarProps {
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

export function SearchBar({ isExpanded, onExpandChange }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const searchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          category:categories(name),
          images:product_images(url, is_primary)
        `)
        .eq("is_active", true)
        .ilike("name", `%${searchTerm}%`)
        .limit(6);

      if (error) throw error;

      const formattedResults: SearchProduct[] = (data || []).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
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
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onExpandChange(false);
  };

  const handleSelect = (slug: string) => {
    handleClose();
    navigate(`/produto/${slug}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Toggle Button */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onExpandChange(true)}
          aria-label="Abrir pesquisa"
        >
          <Search size={20} />
        </Button>
      )}

      {/* Expanded Search Bar */}
      {isExpanded && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px] sm:w-[320px] md:w-[400px] z-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar produtos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9 bg-background border-border"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 h-full aspect-square"
              onClick={handleClose}
              aria-label="Fechar pesquisa"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Results Dropdown */}
          {(isLoading || results.length > 0 || (query.trim() && !isLoading)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && query.trim() && results.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum produto encontrado.
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <ul className="divide-y divide-border max-h-[320px] overflow-y-auto">
                  {results.map((product) => (
                    <li key={product.id}>
                      <button
                        onClick={() => handleSelect(product.slug)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover bg-muted flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-foreground">{product.name}</p>
                          {product.category_name && (
                            <p className="text-xs text-muted-foreground">
                              {product.category_name}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                          {formatPrice(product.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
