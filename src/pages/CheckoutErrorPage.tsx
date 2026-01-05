import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CheckoutErrorPage = () => {
  return (
    <>
      <Helmet>
        <title>Erro no Pagamento | Vitz</title>
        <meta name="description" content="Houve um problema com seu pagamento" />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-lg">
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Pagamento não aprovado
                </h1>
                <p className="text-muted-foreground mb-8">
                  Houve um problema ao processar seu pagamento. Por favor, tente novamente ou use outra forma de pagamento.
                </p>

                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link to="/checkout">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar novamente
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/carrinho">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar ao carrinho
                    </Link>
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

export default CheckoutErrorPage;
