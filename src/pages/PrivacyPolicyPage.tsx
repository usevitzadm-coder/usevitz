import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Política de Privacidade | Vitz</title>
        <meta 
          name="description" 
          content="Política de Privacidade da Vitz. Saiba como coletamos, usamos e protegemos suas informações pessoais conforme a LGPD." 
        />
      </Helmet>

      <main className="bg-background">
        <section className="py-16 md:py-24">
          <div className="vitz-container">
            <div className="max-w-3xl mx-auto">
              {/* Title */}
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-primary mb-8 text-center">
                Política de Privacidade
              </h1>

              {/* Introduction */}
              <p className="text-foreground/80 text-lg leading-relaxed mb-12 text-center">
                A Vitz respeita a privacidade dos seus clientes e se compromete a proteger todas as 
                informações pessoais fornecidas em nosso site. Esta política explica como coletamos, 
                usamos e protegemos os seus dados.
              </p>

              {/* Sections */}
              <div className="space-y-10">
                {/* 1. Coleta de Informações */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    1. Coleta de Informações
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    Coletamos informações pessoais fornecidas diretamente pelo cliente ao realizar compras, 
                    criar uma conta ou entrar em contato conosco. As informações podem incluir:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Nome completo;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Endereço de entrega e faturamento;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">E-mail e telefone de contato;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">CPF;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Data de Nascimento;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Dados de pagamento (processados por intermediários de pagamento seguros);</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Preferências e interações no site.</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Uso das Informações */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    2. Uso das Informações
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    As informações coletadas são utilizadas para:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Processamento de pedidos e pagamentos;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Entrega de produtos e atualização sobre o status do pedido;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Atendimento ao cliente e suporte;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Envio de comunicações sobre promoções e novidades (com consentimento do cliente);</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Melhoria dos nossos serviços e personalização da experiência de compra.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Compartilhamento de Informações */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    3. Compartilhamento de Informações
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    A Vitz não vende ou compartilha dados pessoais com terceiros, exceto nas seguintes casos:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Para parceiros logísticos e de pagamento, apenas o necessário para concluir transações e entregas;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Quando exigido por lei ou autoridades competentes;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Para proteger os direitos e segurança da Vitz e seus clientes.</span>
                    </li>
                  </ul>
                </div>

                {/* 4. Segurança dos Dados */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    4. Segurança dos Dados
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Adotamos medidas de segurança para proteger os dados pessoais contra acessos não autorizados, 
                    alteração ou divulgação indevida. O site conta com criptografia SSL e outras ferramentas de proteção.
                  </p>
                </div>

                {/* 5. Direitos do Cliente */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    5. Direitos do Cliente
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    Os clientes podem:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Solicitar a exclusão ou alteração de seus dados pessoais;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Optar por não receber comunicações de marketing;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/80">Acessar e corrigir informações armazenadas.</span>
                    </li>
                  </ul>
                </div>

                {/* 6. Cookies */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    6. Cookies e Tecnologias de Rastreamento
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    Utilizamos cookies para melhorar a experiência do usuário, personalizar conteúdo e coletar 
                    dados anônimos sobre o uso do site. Os clientes podem gerenciar preferências de cookies em 
                    seu navegador.
                  </p>
                </div>

                {/* 7. Alterações */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-primary mb-4">
                    7. Alterações nesta Política
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    A Vitz pode atualizar esta política de privacidade periodicamente. Recomendamos a revisão 
                    regular para estar ciente das alterações.
                  </p>
                  <p className="text-foreground/80 leading-relaxed mt-4">
                    Para mais informações ou solicitações relacionadas à privacidade, entre em contato pelo e-mail{" "}
                    <a 
                      href="mailto:suporte@usevitz.com" 
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      suporte@usevitz.com
                    </a>
                    {" "}ou WhatsApp{" "}
                    <a 
                      href="https://wa.me/5511915294545" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:text-primary/80 transition-colors"
                    >
                      (11) 91520-4545
                    </a>.
                  </p>
                </div>
              </div>

              {/* LGPD Note */}
              <div className="mt-16 pt-8 border-t border-border">
                <p className="text-foreground/60 text-sm text-center">
                  Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default PrivacyPolicyPage;
