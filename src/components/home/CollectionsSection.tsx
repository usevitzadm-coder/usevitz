import { Link } from "react-router-dom";
import { collections } from "@/data/products";

const CollectionsSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="vitz-container">
        <div className="text-center mb-12">
          <span className="vitz-label text-primary">Coleções</span>
          <h2 className="vitz-heading-lg text-foreground mt-2">
            Explore por categoria
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              to={`/colecao/${collection.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="font-heading text-3xl md:text-4xl text-background mb-2">
                  {collection.name}
                </h3>
                <p className="text-background/80 text-sm mb-4">
                  {collection.description}
                </p>
                <span className="vitz-label text-background border-b border-background/50 pb-1 group-hover:border-background transition-colors">
                  Explorar Coleção
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsSection;
