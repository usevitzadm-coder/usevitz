import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export interface ProductFiltersState {
  priceRange: [number, number];
  colors: string[];
  categories: string[];
  sizes: string[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  maxPrice: number;
}

const ProductFilters = ({ categories, filters, onFiltersChange, maxPrice }: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<ProductFiltersState>(filters);

  // Fetch available colors and sizes
  useEffect(() => {
    const fetchVariants = async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("color, size")
        .eq("is_active", true);

      if (data) {
        const colors = [...new Set(data.map((v) => v.color))].sort();
        const sizes = [...new Set(data.map((v) => v.size))];
        
        // Sort sizes logically
        const sizeOrder = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
        sizes.sort((a, b) => {
          const indexA = sizeOrder.indexOf(a);
          const indexB = sizeOrder.indexOf(b);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        });

        setAvailableColors(colors);
        setAvailableSizes(sizes);
      }
    };

    fetchVariants();
  }, []);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleColorToggle = (color: string) => {
    const newColors = localFilters.colors.includes(color)
      ? localFilters.colors.filter((c) => c !== color)
      : [...localFilters.colors, color];
    setLocalFilters({ ...localFilters, colors: newColors });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = localFilters.sizes.includes(size)
      ? localFilters.sizes.filter((s) => s !== size)
      : [...localFilters.sizes, size];
    setLocalFilters({ ...localFilters, sizes: newSizes });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = localFilters.categories.includes(categoryId)
      ? localFilters.categories.filter((c) => c !== categoryId)
      : [...localFilters.categories, categoryId];
    setLocalFilters({ ...localFilters, categories: newCategories });
  };

  const handlePriceChange = (value: number[]) => {
    setLocalFilters({ ...localFilters, priceRange: [value[0], value[1]] });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters: ProductFiltersState = {
      priceRange: [0, maxPrice],
      colors: [],
      categories: [],
      sizes: [],
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount =
    (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < maxPrice ? 1 : 0) +
    localFilters.colors.length +
    localFilters.categories.length +
    localFilters.sizes.length;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filtros
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Limpar tudo
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="font-medium mb-4">Preço</h3>
            <div className="px-2">
              <Slider
                value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
                onValueChange={handlePriceChange}
                max={maxPrice}
                min={0}
                step={10}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatPrice(localFilters.priceRange[0])}</span>
                <span>{formatPrice(localFilters.priceRange[1])}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Categories */}
          <div>
            <h3 className="font-medium mb-4">Categoria</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={localFilters.categories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Colors */}
          <div>
            <h3 className="font-medium mb-4">Cor</h3>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    localFilters.colors.includes(color)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sizes */}
          <div>
            <h3 className="font-medium mb-4">Tamanho</h3>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`w-12 h-10 rounded-md text-sm border transition-colors ${
                    localFilters.sizes.includes(size)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-8 sticky bottom-0 bg-background pt-4 pb-2 border-t">
          <Button onClick={applyFilters} className="w-full">
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductFilters;
