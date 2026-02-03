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
    <div className="space-y-3">
      <div
        className="flex gap-3"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Thumbnails - Vertical Column on Left (Desktop) */}
        {images.length > 1 && (
          <div className="hidden lg:flex flex-col gap-1.5 shrink-0 max-h-[600px] overflow-y-auto pr-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`w-10 rounded-sm overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? "border-primary opacity-100"
                    : "border-transparent opacity-70 hover:opacity-100"
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
        <div className="relative flex-1 min-w-0 flex items-center justify-center">
          <div className="relative w-full max-h-[45vh] lg:max-h-none aspect-[3/4] overflow-hidden rounded-sm bg-muted">
            <img
              src={images[selectedIndex]?.url}
              alt={productName}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            
            {/* Navigation Arrows - Inside image container */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-background/80 backdrop-blur-sm border-0 shadow-md hover:bg-background z-10"
                  onClick={goToPrev}
                >
                  <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="sr-only">Imagem anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-background/80 backdrop-blur-sm border-0 shadow-md hover:bg-background z-10"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="sr-only">Próxima imagem</span>
                </Button>
              </>
            )}

            {/* Dots indicator (mobile only) */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden z-10">
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
      </div>

      {/* Mobile Thumbnails - Horizontal below main image */}
      {images.length > 1 && (
        <div className="lg:hidden">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-12 h-14 rounded-sm overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? "border-primary opacity-100"
                    : "border-transparent opacity-60"
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
