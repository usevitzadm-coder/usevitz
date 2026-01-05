import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, Minus, Plus, ChevronRight, Truck, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getProductBySlug, products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/product/ProductCard";
import { useToast } from "@/hooks/use-toast";

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <Layout>
        <div className="vitz-container py-20 text-center">
          <h1 className="vitz-heading-lg mb-4">Produto não encontrado</h1>
          <Button variant="hero" asChild>
            <Link to="/">Voltar para Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const colorHexMap = Object.fromEntries(
    product.variants.map((v) => [v.color, v.colorHex])
  );

  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast({
        title: "Selecione as opções",
        description: "Por favor, escolha o tamanho e a cor.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVariant || isOutOfStock) {
      toast({
        title: "Produto indisponível",
        description: "Esta variação está esgotada.",
        variant: "destructive",
      });
      return;
    }

    addToCart(product, selectedVariant, quantity);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <>
      <Helmet>
        <title>{product.name} | Vitz - Roupas Fitness Premium</title>
        <meta name="description" content={product.shortDescription} />
      </Helmet>
      <Layout>
        {/* Breadcrumb */}
        <nav className="vitz-container py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight size={14} />
            <li>
              <Link
                to={`/colecao/${product.category}`}
                className="hover:text-foreground transition-colors capitalize"
              >
                {product.category}
              </Link>
            </li>
            <ChevronRight size={14} />
            <li className="text-foreground">{product.name}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <section className="vitz-container pb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="aspect-[3/4] overflow-hidden rounded-sm bg-muted">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-24 rounded-sm overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              {product.badge && (
                <span className="inline-block bg-primary text-primary-foreground text-xs px-3 py-1 rounded-sm font-medium uppercase tracking-wider">
                  {product.badge === "novo"
                    ? "Novo"
                    : product.badge === "mais-vendido"
                    ? "Mais Vendido"
                    : "Promo"}
                </span>
              )}

              <h1 className="vitz-heading-lg text-foreground">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(product.rating)
                          ? "fill-primary text-primary"
                          : "text-muted"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviewCount} avaliações)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <p className="vitz-body text-muted-foreground">
                {product.shortDescription}
              </p>

              {/* Color Selection */}
              <div>
                <h3 className="vitz-label mb-3">
                  Cor: {selectedColor && <span className="font-normal text-foreground ml-2 normal-case tracking-normal">{selectedColor}</span>}
                </h3>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? "border-foreground scale-110"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      style={{ backgroundColor: colorHexMap[color] }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="vitz-label">Tamanho</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground underline">
                    Guia de tamanhos
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-12 px-4 border rounded-sm text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {product.sizeGuide && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {product.sizeGuide}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <h3 className="vitz-label mb-3">Quantidade</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-muted transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-muted transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {selectedVariant && (
                    <span className="text-sm text-muted-foreground">
                      {selectedVariant.stock} em estoque
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="hero"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Esgotado" : "Adicionar ao Carrinho"}
                </Button>
              </div>

              {/* Benefits */}
              <div className="flex gap-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck size={18} />
                  <span>Frete grátis acima de R$ 299</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw size={18} />
                  <span>Troca grátis</span>
                </div>
              </div>

              {/* Description */}
              <div className="pt-6 border-t border-border">
                <h3 className="vitz-label mb-4">Descrição</h3>
                <p className="vitz-body text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Benefits List */}
              <div className="pt-6 border-t border-border">
                <h3 className="vitz-label mb-4">Benefícios</h3>
                <ul className="space-y-2">
                  {product.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-16 bg-vitz-cream-dark">
            <div className="vitz-container">
              <h2 className="vitz-heading-md text-foreground mb-8">
                Você também pode gostar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}
      </Layout>
    </>
  );
};

export default ProductPage;
