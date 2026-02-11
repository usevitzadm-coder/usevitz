import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";

const ReturnsPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Trocas e Devoluções | Vitz</title>
        <meta 
          name="description" 
          content="Política de trocas e devoluções da Vitz. Saiba como solicitar troca ou devolução, prazos, condições e procedimentos." 
        />
      </Helmet>

      <main className="bg-background">
        <section className="py-16 md:py-24">
          <div className="vitz-container">
            <div className="max-w-3xl mx-auto">
              {/* Title */}
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-primary mb-8 text-center">
                Política de Trocas e Devoluções
              </h1>

              {/* Introduction */}
              <p className="text-foreground/80 text-lg leading-relaxed mb-12 text-center">
                A Vitz se compromete a garantir a satisfação dos nossos clientes. Caso necessite trocar 
                ou devolver um produto, siga as diretrizes abaixo.
              </p>

              {/* Sections */}
              <div className="space-y-10">
                {/* 1. Condições Gerais */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    1. Condições Gerais
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    Aceitamos trocas e devoluções nos seguintes casos:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Produto com defeito de fabricação;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Produto(s) entregue(s) divergente(s) do pedido realizado;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Insatisfação com o produto (dentro do prazo estabelecido).</span>
                    </li>
                  </ul>
                  <p className="text-foreground/80 leading-relaxed mt-4">
                    Produtos em promoção podem ser trocados ou devolvidos dentro dos prazos estabelecidos, 
                    conforme previsto no Código de Defesa do Consumidor (Art. 49).
                  </p>
                </div>

                {/* 2. Prazos */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    2. Prazos para Trocas e Devoluções
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Todas as solicitações de troca ou devolução, seja por defeito de fabricação, erro no envio 
                    ou insatisfação, devem ser feitas em até 7 dias corridos após o recebimento do produto, 
                    conforme previsto no Código de Defesa do Consumidor (Art. 49).
                  </p>
                </div>

                {/* 3. Procedimento */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    3. Procedimento
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    Para solicitar a troca ou devolução, entre em contato pelo e-mail suporte@usevitz.com 
                    ou WhatsApp (11) 91520-4545 informando:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Nome completo e número do pedido;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Motivo da troca ou devolução;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Fotos do produto (em caso de defeito).</span>
                    </li>
                  </ul>
                  <p className="text-foreground/80 leading-relaxed mt-4">
                    Nossa equipe avaliará a solicitação e fornecerá as instruções para devolução ou troca.
                  </p>
                </div>

                {/* 4. Condições do Produto */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    4. Condições do Produto
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    O produto deve estar:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Sem sinais de uso ou lavagem;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Com etiquetas e embalagem original;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Acompanhado da nota fiscal.</span>
                    </li>
                  </ul>
                  <p className="text-foreground/80 leading-relaxed mt-4">
                    Caso o produto não esteja de acordo com as condições acima, a troca ou devolução poderá 
                    ser recusada.
                  </p>
                </div>

                {/* 5. Reembolso */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    5. Reembolso
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    Caso opte pela devolução, o reembolso será processado conforme o método de pagamento utilizado:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">
                        Cartão de crédito: estorno na próxima fatura ou em até 2 faturas subsequentes, 
                        conforme regras da administradora do cartão;
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">
                        Boleto ou Pix: depósito em conta em até 10 dias úteis após a confirmação da devolução do produto.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 6. Custos de Envio */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    6. Custos de Envio
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Se o erro for da Vitz (como defeito ou erro no envio), o frete de devolução será arcado 
                    por nós. Caso contrário, o cliente será responsável pelos custos de envio da devolução ou troca.
                  </p>
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-16 pt-8 border-t border-border">
                <p className="text-foreground/60 text-sm text-center italic">
                  Esta política pode ser atualizada periodicamente. Para mais informações, entre em contato conosco.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ReturnsPage;
