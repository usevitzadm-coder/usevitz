const BrandStory = () => {
  return (
    <section className="py-20 md:py-28 bg-vitz-mint/30">
      <div className="vitz-container">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="vitz-label text-primary">Manifesto</span>
          <h2 className="vitz-heading-lg text-foreground">
            Vitz é para quem vive em movimento
          </h2>
          <p className="vitz-body text-muted-foreground leading-relaxed">
            Acreditamos que vestir-se bem vai além da estética. Nossas roupas são 
            desenvolvidas para acompanhar cada passo da sua jornada, seja no treino 
            intenso, no yoga ao amanhecer ou simplesmente vivendo o dia a dia com 
            conforto e estilo. Cada peça é pensada para que você se sinta confiante, 
            livre e poderosa.
          </p>
          <div className="flex justify-center gap-8 pt-6">
            <div className="text-center">
              <span className="font-heading text-4xl text-primary">10k+</span>
              <p className="text-sm text-muted-foreground mt-1">Clientes satisfeitas</p>
            </div>
            <div className="text-center">
              <span className="font-heading text-4xl text-primary">4.9</span>
              <p className="text-sm text-muted-foreground mt-1">Avaliação média</p>
            </div>
            <div className="text-center">
              <span className="font-heading text-4xl text-primary">100%</span>
              <p className="text-sm text-muted-foreground mt-1">Premium quality</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
