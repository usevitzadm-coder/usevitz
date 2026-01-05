import { Link } from "react-router-dom";
import { products } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

const FeaturedProducts = () => {
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-20 md:py-28 bg-vitz-cream-dark">
      <div className="vitz-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="vitz-label text-primary">Destaques</span>
            <h2 className="vitz-heading-lg text-foreground mt-2">
              Produtos em destaque
            </h2>
          </div>
          <Button variant="minimal" className="mt-4 md:mt-0" asChild>
            <Link to="/colecao/feminino">Ver todos os produtos</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
