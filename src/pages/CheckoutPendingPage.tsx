import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Mail, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CheckoutPendingPage = () => {
  const [searchParams] = useSearchParams();
  const externalReference = searchParams.get("external_reference");

  return (
    <>
      <Helmet>
        <title>Pagamento Pendente | Vitz</title>
        <meta name="description" content="Seu pagamento está sendo processado" />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-lg">
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-6">
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Pagamento pendente
                </h1>
                <p className="text-muted-foreground mb-6">
                  Seu pagamento está sendo processado. Assim que for confirmado, você receberá um email com os detalhes.
                </p>

                {externalReference && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Número do pedido</p>
                    <p className="font-mono font-medium">{externalReference}</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-8">
                  <Mail className="w-5 h-5" />
                  <span>Fique atento ao seu email para atualizações</span>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link to="/produtos">
                      Continuar comprando
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/">Voltar para a home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CheckoutPendingPage;
