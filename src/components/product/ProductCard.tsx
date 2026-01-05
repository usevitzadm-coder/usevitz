import { Link } from "react-router-dom";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getBadgeLabel = (badge?: string) => {
    switch (badge) {
      case "novo":
        return "Novo";
      case "mais-vendido":
        return "Mais Vendido";
      case "promo":
        return "Promo";
      default:
        return null;
    }
  };

  const badgeLabel = getBadgeLabel(product.badge);

  return (
    <Link
      to={`/produto/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted mb-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {badgeLabel && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-sm font-medium uppercase tracking-wider">
            {badgeLabel}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {product.shortDescription}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-medium text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
