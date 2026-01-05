import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Gift, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GiftCardInfo {
  code: string;
  current_balance: number;
  initial_value: number;
  expires_at: string;
  is_active: boolean;
}

const CheckGiftCardPage = () => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [giftCard, setGiftCard] = useState<GiftCardInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleSearch = async () => {
    if (!code.trim()) {
      toast({
        title: "Digite o código do gift card",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGiftCard(null);

    try {
      // Normalize code (remove dashes and spaces, uppercase)
      const normalizedCode = code.replace(/[-\s]/g, "").toUpperCase();
      const formattedCode = normalizedCode.match(/.{1,4}/g)?.join("-") || normalizedCode;

      const { data, error: fetchError } = await supabase
        .from("gift_cards")
        .select("code, current_balance, initial_value, expires_at, is_active")
        .eq("code", formattedCode)
        .single();

      if (fetchError || !data) {
        setError("Gift card não encontrado. Verifique o código e tente novamente.");
        return;
      }

      setGiftCard(data);
    } catch (err) {
      console.error("Error fetching gift card:", err);
      setError("Erro ao buscar gift card. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = giftCard && new Date(giftCard.expires_at) < new Date();
  const isUsed = giftCard && giftCard.current_balance === 0;

  return (
    <>
      <Helmet>
        <title>Consultar Gift Card | Vitz</title>
        <meta
          name="description"
          content="Consulte o saldo do seu Gift Card Vitz."
        />
      </Helmet>
      <Layout>
        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-lg">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Consultar Gift Card
              </h1>
              <p className="text-muted-foreground">
                Verifique o saldo e validade do seu gift card
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="pl-10"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? "Buscando..." : "Consultar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error State */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Gift Card Info */}
            {giftCard && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Saldo disponível</p>
                    <p
                      className={`text-4xl font-bold ${
                        isExpired || isUsed || !giftCard.is_active
                          ? "text-muted-foreground"
                          : "text-primary"
                      }`}
                    >
                      {formatPrice(giftCard.current_balance)}
                    </p>
                    
                    {isExpired && (
                      <span className="inline-block mt-3 px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
                        Expirado
                      </span>
                    )}
                    
                    {isUsed && !isExpired && (
                      <span className="inline-block mt-3 px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                        Saldo esgotado
                      </span>
                    )}
                    
                    {!giftCard.is_active && !isExpired && !isUsed && (
                      <span className="inline-block mt-3 px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Código</span>
                      <span className="font-mono font-medium">{giftCard.code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor inicial</span>
                      <span>{formatPrice(giftCard.initial_value)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Válido até</span>
                      <span className={isExpired ? "text-destructive" : ""}>
                        {formatDate(giftCard.expires_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CheckGiftCardPage;
