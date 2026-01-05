import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const DeliveryPolicyPage = () => {
  const sections = [
    {
      title: "1. Prazos de Entrega",
      content: [
        "Os prazos de entrega variam conforme a região e o método de envio escolhido pelo cliente no momento da compra. O prazo de entrega é calculado e exibido no checkout, de acordo com a transportadora selecionada pelo cliente.",
        "Os prazos começam a contar a partir da confirmação do pagamento, que pode levar até 2 dias úteis, dependendo do método escolhido."
      ]
    },
    {
      title: "2. Modalidades de Envio",
      content: [
        "Trabalhamos com transportadoras parceiras e os Correios para oferecer diferentes opções de envio:",
        "• Entrega Padrão: opção mais econômica, com prazo regular.",
        "• Entrega Expressa: envio mais rápido, disponível para algumas regiões."
      ]
    },
    {
      title: "3. Custos de Frete",
      content: [
        "O valor do frete é calculado automaticamente no momento da compra, com base no CEP de destino, peso e dimensões do pedido. Em algumas promoções, o frete pode ser gratuito, conforme condições divulgadas no site."
      ]
    },
    {
      title: "4. Rastreamento do Pedido",
      content: [
        "Após o envio, o cliente receberá um código de rastreamento por e-mail, permitindo acompanhar a entrega diretamente pelo site da transportadora ou Correios."
      ]
    },
    {
      title: "5. Tentativas de Entrega",
      content: [
        "As transportadoras realizam até três tentativas de entrega. Caso não haja sucesso, o pedido poderá ser encaminhado para um ponto de retirada ou devolvido ao nosso centro de distribuição. Nesses casos, entraremos em contato para definir a melhor solução."
      ]
    },
    {
      title: "6. Problemas com a Entrega",
      content: [
        "Se houver qualquer problema com a entrega (atraso, extravio ou avaria), entre em contato com nosso suporte pelo e-mail usevitz.adm@gmail.com ou WhatsApp (11) 91520-4545, que nossa equipe estará pronta para ajudar. Em caso de devoluções, poderá ser consultada toda a nossa política de devolução."
      ],
      hasLink: true
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Política de Entrega | Vitz</title>
        <meta 
          name="description" 
          content="Conheça a política de entrega da Vitz. Informações sobre prazos, modalidades de envio, custos de frete e rastreamento de pedidos." 
        />
      </Helmet>

      <main className="bg-background">
        <section className="py-16 md:py-24">
          <div className="vitz-container">
            <div className="max-w-3xl mx-auto">
              {/* Title */}
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-primary mb-8 text-center">
                Política de Envio
              </h1>

              {/* Introduction */}
              <p className="text-foreground/80 text-lg leading-relaxed mb-12 text-center">
                A Vitz se compromete a oferecer um processo de entrega eficiente e seguro para garantir 
                a melhor experiência de compra para nossos clientes. Abaixo, você encontrará informações 
                detalhadas sobre os prazos, modalidades e condições de envio.
              </p>

              {/* Sections */}
              <div className="space-y-10">
                {sections.map((section, index) => (
                  <div key={index}>
                    <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                      {section.title}
                    </h2>
                    <div className="space-y-3">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-foreground/80 leading-relaxed">
                          {paragraph}
                          {section.hasLink && pIndex === section.content.length - 1 && (
                            <>
                              {" "}
                              <Link 
                                to="/trocas" 
                                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                              >
                                política de devolução
                              </Link>
                              .
                            </>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <div className="mt-16 pt-8 border-t border-border">
                <p className="text-foreground/60 text-sm text-center italic">
                  Esta política pode ser atualizada sem aviso prévio, visando melhorias no serviço.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default DeliveryPolicyPage;
