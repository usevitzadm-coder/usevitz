import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Gift, Mail, User, MessageSquare, ChevronRight } from "lucide-react";
import giftCardImage from "@/assets/giftcard-vitz.png";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const GIFT_CARD_VALUES = [50, 100, 150, 200, 300];

const generateGiftCardCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const GiftCardPage = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number>(100);
  const [sendTo, setSendTo] = useState<"self" | "recipient">("recipient");
  const [formData, setFormData] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    return selectedValue > 0;
  };

  const validateStep2 = () => {
    if (!formData.purchaserName || !formData.purchaserEmail) return false;
    if (sendTo === "recipient" && (!formData.recipientName || !formData.recipientEmail)) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const code = generateGiftCardCode();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data: giftCard, error } = await supabase
        .from("gift_cards")
        .insert({
          code,
          initial_value: selectedValue,
          current_balance: selectedValue,
          purchaser_email: formData.purchaserEmail,
          purchaser_name: formData.purchaserName,
          recipient_email: sendTo === "recipient" ? formData.recipientEmail : null,
          recipient_name: sendTo === "recipient" ? formData.recipientName : null,
          recipient_message: formData.message || null,
          send_to_recipient: sendTo === "recipient",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create transaction record
      await supabase.from("gift_card_transactions").insert({
        gift_card_id: giftCard.id,
        amount: selectedValue,
        type: "purchase",
        notes: `Gift card purchased by ${formData.purchaserName}`,
      });

      setStep(3);
      toast({
        title: "Gift Card criado com sucesso!",
        description: `Código: ${code}`,
      });
    } catch (error: any) {
      console.error("Error creating gift card:", error);
      toast({
        title: "Erro ao criar gift card",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Gift Card | Vitz</title>
        <meta
          name="description"
          content="Presenteie quem você ama com um Gift Card Vitz. Escolha o valor e envie de presente."
        />
      </Helmet>
      <Layout>
          <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Header with Image */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <img
                  src={giftCardImage}
                  alt="Gift Card Vitz"
                  className="w-48 md:w-64 h-auto object-contain"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Gift Card Vitz
              </h1>
              <p className="text-muted-foreground">
                Presenteie quem você ama com estilo e conforto
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 mx-1",
                        step > s ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Choose Value */}
            {step === 1 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-6">Escolha o valor</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {GIFT_CARD_VALUES.map((value) => (
                      <button
                        key={value}
                        onClick={() => setSelectedValue(value)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all flex items-center justify-center",
                          selectedValue === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(value)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!validateStep1()}
                    className="w-full"
                    size="lg"
                  >
                    Continuar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Recipient Details */}
            {step === 2 && (
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Para quem enviar?</h2>
                    <RadioGroup
                      value={sendTo}
                      onValueChange={(v) => setSendTo(v as "self" | "recipient")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recipient" id="recipient" />
                        <Label htmlFor="recipient">Enviar para o presenteado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="self" id="self" />
                        <Label htmlFor="self">Enviar para mim</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Seus dados</h3>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="purchaserName">Seu nome *</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="purchaserName"
                            value={formData.purchaserName}
                            onChange={(e) => handleInputChange("purchaserName", e.target.value)}
                            className="pl-10"
                            placeholder="Seu nome completo"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="purchaserEmail">Seu email *</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="purchaserEmail"
                            type="email"
                            value={formData.purchaserEmail}
                            onChange={(e) => handleInputChange("purchaserEmail", e.target.value)}
                            className="pl-10"
                            placeholder="seu@email.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {sendTo === "recipient" && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-foreground">Dados do presenteado</h3>
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="recipientName">Nome do presenteado *</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="recipientName"
                              value={formData.recipientName}
                              onChange={(e) => handleInputChange("recipientName", e.target.value)}
                              className="pl-10"
                              placeholder="Nome de quem vai receber"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="recipientEmail">Email do presenteado *</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="recipientEmail"
                              type="email"
                              value={formData.recipientEmail}
                              onChange={(e) => handleInputChange("recipientEmail", e.target.value)}
                              className="pl-10"
                              placeholder="email@presenteado.com"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="message">Mensagem (opcional)</Label>
                          <div className="relative mt-1">
                            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Textarea
                              id="message"
                              value={formData.message}
                              onChange={(e) => handleInputChange("message", e.target.value)}
                              className="pl-10 min-h-[100px]"
                              placeholder="Escreva uma mensagem especial..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Voltar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!validateStep2() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Processando..." : `Comprar ${formatPrice(selectedValue)}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <Gift className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Gift Card criado!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {sendTo === "recipient"
                      ? `O gift card será enviado para ${formData.recipientEmail}`
                      : `O gift card foi enviado para ${formData.purchaserEmail}`}
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Valor do Gift Card</p>
                    <p className="text-3xl font-bold text-primary">{formatPrice(selectedValue)}</p>
                    <p className="text-sm text-muted-foreground mt-4">Válido por 1 ano</p>
                  </div>
                  <Button
                    onClick={() => {
                      setStep(1);
                      setFormData({
                        purchaserName: "",
                        purchaserEmail: "",
                        recipientName: "",
                        recipientEmail: "",
                        message: "",
                      });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Comprar outro Gift Card
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Section */}
            <div className="mt-10 text-center text-sm text-muted-foreground">
              <p>
                O Gift Card Vitz pode ser usado em qualquer compra no site.
                <br />
                Válido por 1 ano a partir da data de compra.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default GiftCardPage;
