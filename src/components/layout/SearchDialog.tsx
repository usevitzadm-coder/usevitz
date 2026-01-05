import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  category_name: string | null;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        .limit(8);

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

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    navigate(`/produto/${slug}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar produtos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && query.trim() && results.length === 0 && (
          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
        )}
        {!isLoading && results.length > 0 && (
          <CommandGroup heading="Produtos">
            {results.map((product) => (
              <CommandItem
                key={product.id}
                value={product.name}
                onSelect={() => handleSelect(product.slug)}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-10 w-10 rounded-md object-cover bg-muted"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  {product.category_name && (
                    <p className="text-xs text-muted-foreground">
                      {product.category_name}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatPrice(product.price)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!isLoading && !query.trim() && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Digite para buscar produtos...
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
