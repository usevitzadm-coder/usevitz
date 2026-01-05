import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const paymentId = searchParams.get("payment_id");
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    // Clear cart after successful purchase
    clearCart();
  }, [clearCart]);

  return (
    <>
      <Helmet>
        <title>Compra Confirmada | Vitz</title>
        <meta name="description" content="Sua compra foi confirmada com sucesso!" />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-lg">
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Compra confirmada!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Obrigado por comprar na Vitz. Seu pedido foi recebido com sucesso.
                </p>

                {externalReference && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Número do pedido</p>
                    <p className="font-mono font-medium">{externalReference}</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-8">
                  <Package className="w-5 h-5" />
                  <span>Você receberá um email com os detalhes do pedido</span>
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

export default CheckoutSuccessPage;
