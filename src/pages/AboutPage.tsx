import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";

const AboutPage = () => {
  const values = [
    {
      title: "Conforto",
      description: "Peças que abraçam o corpo e permitem liberdade total de movimento."
    },
    {
      title: "Qualidade",
      description: "Materiais premium que garantem durabilidade e desempenho."
    },
    {
      title: "Elegância",
      description: "Modelagens sofisticadas que elevam qualquer produção."
    },
    {
      title: "Confiança",
      description: "Queremos que cada mulher se sinta poderosa e segura ao vestir Vitz."
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Quem Somos | Vitz</title>
        <meta 
          name="description" 
          content="Conheça a história da Vitz. Uma marca fitness premium nascida do desejo de unir estilo, conforto e qualidade para mulheres ativas." 
        />
      </Helmet>

      <main className="bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="vitz-container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-8">
                Minha história
              </h1>
              
              <div className="space-y-6 text-foreground/80 text-lg leading-relaxed">
                <p>
                  A Vitz nasceu de um desejo compartilhado entre duas irmãs e uma cunhada: encontrar 
                  roupas que unissem estilo, conforto e qualidade para acompanhar a rotina de uma vida 
                  ativa. Em uma conversa descontraída à mesa, surgiu a ideia de criar uma marca que 
                  inspirasse outras mulheres a se sentirem confiantes e elegantes em qualquer momento do 
                  dia – seja na academia, no trabalho ou em momentos de lazer.
                </p>
                <p>
                  Minha missão vai além da moda: quero inspirar um lifestyle, proporcionando peças que 
                  combinam sofisticação, bem-estar e funcionalidade. Acredito que o movimento faz parte 
                  da vida, e eu estou aqui para garantir que você se sinta incrível em todos os seus 
                  momentos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted/30">
          <div className="vitz-container">
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Missão */}
                <div>
                  <h2 className="font-heading text-2xl md:text-3xl font-semibold text-primary mb-4">
                    Missão
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Inspirar um lifestyle com conforto e qualidade, criando uma comunidade focada no 
                    movimento em diversos ambientes.
                  </p>
                </div>

                {/* Visão */}
                <div>
                  <h2 className="font-heading text-2xl md:text-3xl font-semibold text-primary mb-4">
                    Visão
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Ser referência na categoria de sportwear quando se fala em peças confortáveis e de 
                    qualidade, que promovam elegância ao look.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24">
          <div className="vitz-container">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-primary mb-8 text-center">
                Valores
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {values.map((value, index) => (
                  <div 
                    key={index}
                    className="bg-muted/20 border border-border/50 rounded-lg p-6 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {value.title}
                        </h3>
                        <p className="text-foreground/70 text-sm">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="vitz-container">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-lg md:text-xl leading-relaxed">
                Mais do que uma marca, <span className="font-heading font-semibold">Vitz</span> é um 
                estilo de vida. O movimento no seu momento.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default AboutPage;
