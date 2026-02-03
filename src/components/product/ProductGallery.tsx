import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const desktopThumbsRef = useRef<HTMLDivElement>(null);
  const mobileThumbsRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll thumbnails to center selected
  useEffect(() => {
    // Desktop vertical scroll
    if (desktopThumbsRef.current) {
      const container = desktopThumbsRef.current;
      const thumb = container.children[selectedIndex] as HTMLElement;
      if (thumb) {
        const containerHeight = container.clientHeight;
        const thumbTop = thumb.offsetTop;
        const thumbHeight = thumb.clientHeight;
        const scrollTo = thumbTop - containerHeight / 2 + thumbHeight / 2;
        container.scrollTo({ top: scrollTo, behavior: "smooth" });
      }
    }

    // Mobile horizontal scroll
    if (mobileThumbsRef.current) {
      const container = mobileThumbsRef.current;
      const thumb = container.children[selectedIndex] as HTMLElement;
      if (thumb) {
        const containerWidth = container.clientWidth;
        const thumbLeft = thumb.offsetLeft;
        const thumbWidth = thumb.clientWidth;
        const scrollTo = thumbLeft - containerWidth / 2 + thumbWidth / 2;
        container.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-muted rounded-sm flex items-center justify-center text-muted-foreground">
        Sem imagem
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-full overflow-hidden">
      <div
        className="flex gap-3 max-w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Thumbnails - Vertical Column on Left (Desktop) */}
        {images.length > 1 && (
          <div 
            ref={desktopThumbsRef}
            className="hidden lg:flex flex-col gap-1.5 shrink-0 max-h-[600px] overflow-y-auto pr-1 scrollbar-hide"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`w-10 rounded-sm overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? "border-primary opacity-100 scale-110"
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
        <div className="relative w-full min-w-0 overflow-hidden">
          <div className="aspect-[3/4] w-full rounded-sm bg-muted overflow-hidden">
            <img
              src={images[selectedIndex]?.url}
              alt={productName}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
          </div>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10 hover:bg-white transition-colors"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10 hover:bg-white transition-colors"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )}

          {/* Dots indicator (mobile only) */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden z-10">
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
          <div 
            ref={mobileThumbsRef}
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-12 h-14 rounded-sm overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? "border-primary opacity-100 scale-110"
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
