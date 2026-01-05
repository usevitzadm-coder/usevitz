import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/product/ProductCard";
import { getProductsByCategory, collections } from "@/data/products";

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const products = getProductsByCategory(slug || "");
  const collection = collections.find((c) => c.slug === slug);

  return (
    <>
      <Helmet>
        <title>
          {collection?.name || "Coleção"} | Vitz - Roupas Fitness Premium
        </title>
        <meta
          name="description"
          content={
            collection?.description ||
            "Explore nossa coleção de roupas fitness premium"
          }
        />
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
            <li className="text-foreground capitalize">{slug}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="vitz-container pb-12">
          <h1 className="vitz-heading-xl text-foreground capitalize">{slug}</h1>
          {collection && (
            <p className="vitz-body text-muted-foreground mt-2 max-w-xl">
              {collection.description}
            </p>
          )}
        </header>

        {/* Products Grid */}
        <section className="vitz-container pb-20">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-6">
                Nenhum produto encontrado nesta coleção.
              </p>
              <Link
                to="/"
                className="text-primary underline hover:text-foreground transition-colors"
              >
                Voltar para a home
              </Link>
            </div>
          )}
        </section>
      </Layout>
    </>
  );
};

export default CollectionPage;
