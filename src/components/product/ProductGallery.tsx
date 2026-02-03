import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImage {
  id: string;
  url: string;
  is_primary?: boolean | null;
  display_order?: number | null;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  autoPlayInterval?: number;
}

export default function ProductGallery({
  images,
  productName,
  autoPlayInterval = 3000,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Autoplay
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [images.length, isPaused, autoPlayInterval, goToNext]);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-muted rounded-sm flex items-center justify-center text-muted-foreground">
        Sem imagem
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-3"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Thumbnails - Vertical Column on Left (Desktop) */}
        {images.length > 1 && (
          <div className="hidden lg:flex flex-col gap-2 w-16 shrink-0 max-h-[600px] overflow-y-auto">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`w-full rounded-sm overflow-hidden border-2 transition-colors ${
                  selectedIndex === index
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground"
                }`}
              >
                <img
                  src={image.url}
                  alt={`${productName} - Imagem ${index + 1}`}
                  className="w-full h-auto"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image with Arrows */}
        <div className="relative flex-1">
          <div className="aspect-[3/4] max-h-[55vh] lg:max-h-none overflow-hidden rounded-sm bg-muted">
            <img
              src={images[selectedIndex]?.url}
              alt={productName}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border-0 shadow-md hover:bg-background"
                onClick={goToPrev}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="sr-only">Imagem anterior</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border-0 shadow-md hover:bg-background"
                onClick={goToNext}
              >
                <ChevronRight className="w-5 h-5" />
                <span className="sr-only">Próxima imagem</span>
              </Button>
            </>
          )}

          {/* Dots indicator (mobile only) */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    selectedIndex === index ? "bg-foreground" : "bg-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Thumbnails - Horizontal below main image */}
      {images.length > 1 && (
        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-14 h-16 rounded-sm overflow-hidden border-2 transition-colors ${
                  selectedIndex === index
                    ? "border-primary"
                    : "border-transparent"
                }`}
              >
                <img
                  src={image.url}
                  alt={`${productName} - Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
